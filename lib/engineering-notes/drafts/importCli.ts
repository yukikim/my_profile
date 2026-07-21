import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import type { Payload } from "payload";
import { ZodError } from "zod";
import {
  createEngineeringNoteDraft,
  EngineeringNoteCreateError,
  type CreatedEngineeringNoteDraft,
} from "./createDraft";
import {
  DuplicateEngineeringNoteError,
  assertEngineeringNoteIsNew,
} from "./duplicates";
import { EngineeringNoteDatabaseError } from "./errors";
import {
  RelationshipIntegrityError,
  resolveEngineeringNoteRelationships,
  type RelationshipWarning,
} from "./relationships";
import {
  ENGINEERING_NOTE_DRAFT_LIMITS,
  parseEngineeringNoteDraftJson,
} from "./schemas";
import {
  hasBlockingSensitiveContent,
  inspectSensitiveContent,
  type SensitiveContentFinding,
} from "./sensitiveContent";
import type { EngineeringNoteDraft } from "./types";

export type ImportCliErrorCode =
  | "INVALID_ARGUMENTS"
  | "MISSING_FILE"
  | "FILE_NOT_FOUND"
  | "FILE_NOT_REGULAR"
  | "FILE_UNREADABLE"
  | "INVALID_JSON"
  | "INVALID_INPUT"
  | "SENSITIVE_CONTENT"
  | "APPLY_NOT_AVAILABLE";

export type InputIssue = {
  path: string;
  code: string;
};

/** CLIへ公開してよい固定codeと安全な検査情報だけを保持するエラーです。 */
export class EngineeringNoteImportCliError extends Error {
  constructor(
    readonly code: ImportCliErrorCode,
    readonly inputIssues: readonly InputIssue[] = [],
    readonly sensitiveFindings: readonly SensitiveContentFinding[] = [],
  ) {
    super(code);
    this.name = "EngineeringNoteImportCliError";
  }
}

export type ImportCliArguments = {
  apply: boolean;
  file: string;
};

export type EngineeringNoteDryRunReport = {
  mode: "dry-run";
  draft: EngineeringNoteDraft;
  resolvedRelationshipCount: number;
  relationshipWarnings: RelationshipWarning[];
  sensitiveWarnings: SensitiveContentFinding[];
};

export type EngineeringNoteApplyPreview = Omit<
  EngineeringNoteDryRunReport,
  "mode"
> & {
  mode: "apply";
};

type DryRunPayload = Pick<Payload, "destroy" | "find">;
type ApplyPayload = Pick<Payload, "create" | "destroy" | "find">;

/**
 * 許可するoptionを手作業で列挙し、位置引数・重複option・未知optionをすべて拒否します。
 * `--file value` と `--file=value` の2形式だけを同じ入力へ正規化します。
 */
export function parseImportCliArguments(argv: readonly string[]) {
  let apply = false;
  let file: string | undefined;

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];

    if (argument === "--apply") {
      if (apply) {
        throw new EngineeringNoteImportCliError("INVALID_ARGUMENTS");
      }
      apply = true;
      continue;
    }

    if (argument === "--file" || argument.startsWith("--file=")) {
      if (file !== undefined) {
        throw new EngineeringNoteImportCliError("INVALID_ARGUMENTS");
      }

      const value =
        argument === "--file" ? argv[(index += 1)] : argument.slice(7);
      if (!value || value.startsWith("--")) {
        throw new EngineeringNoteImportCliError("MISSING_FILE");
      }
      file = value;
      continue;
    }

    throw new EngineeringNoteImportCliError("INVALID_ARGUMENTS");
  }

  if (!file) {
    throw new EngineeringNoteImportCliError("MISSING_FILE");
  }

  return { apply, file } satisfies ImportCliArguments;
}

function safePathSegment(segment: PropertyKey) {
  if (typeof segment === "number") {
    return `[${segment}]`;
  }
  if (
    typeof segment === "string" &&
    /^[A-Za-z_$][A-Za-z0-9_$-]*$/.test(segment)
  ) {
    return `.${segment}`;
  }
  return ".<field>";
}

function zodIssues(error: ZodError): InputIssue[] {
  const issues: InputIssue[] = [];

  for (const issue of error.issues) {
    const basePath = `$${issue.path.map(safePathSegment).join("")}`;

    // strict objectの未知keyも個別pathへ展開しますが、危険なkey名自体は伏せます。
    if (issue.code === "unrecognized_keys") {
      for (const key of issue.keys) {
        issues.push({
          path: `${basePath}${safePathSegment(key)}`,
          code: issue.code,
        });
      }
    } else {
      issues.push({ path: basePath, code: issue.code });
    }
  }

  return issues;
}

/** ファイル内容を表示せず、通常ファイル・上限・JSON・schemaを順番に検証します。 */
export async function readEngineeringNoteDraftFile(
  file: string,
  cwd = process.cwd(),
) {
  const filePath = path.resolve(cwd, file);
  let fileStat;

  try {
    fileStat = await stat(filePath);
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    throw new EngineeringNoteImportCliError(
      code === "ENOENT" ? "FILE_NOT_FOUND" : "FILE_UNREADABLE",
    );
  }

  if (!fileStat.isFile()) {
    throw new EngineeringNoteImportCliError("FILE_NOT_REGULAR");
  }
  if (fileStat.size > ENGINEERING_NOTE_DRAFT_LIMITS.fileBytes) {
    throw new EngineeringNoteImportCliError("INVALID_INPUT", [
      { path: "$", code: "too_big" },
    ]);
  }

  let json: string;
  try {
    json = await readFile(filePath, "utf8");
  } catch {
    throw new EngineeringNoteImportCliError("FILE_UNREADABLE");
  }

  try {
    return parseEngineeringNoteDraftJson(json);
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new EngineeringNoteImportCliError("INVALID_JSON");
    }
    if (error instanceof ZodError) {
      throw new EngineeringNoteImportCliError(
        "INVALID_INPUT",
        zodIssues(error),
      );
    }
    if (error instanceof RangeError) {
      throw new EngineeringNoteImportCliError("INVALID_INPUT", [
        { path: "$", code: "too_big" },
      ]);
    }
    throw new EngineeringNoteImportCliError("INVALID_INPUT");
  }
}

function inspectDraftBeforeDatabase(draft: EngineeringNoteDraft) {
  const sensitiveFindings = inspectSensitiveContent(draft);
  if (hasBlockingSensitiveContent(sensitiveFindings)) {
    throw new EngineeringNoteImportCliError(
      "SENSITIVE_CONTENT",
      [],
      sensitiveFindings,
    );
  }
  return sensitiveFindings;
}

async function buildPreflightReport<TMode extends "apply" | "dry-run">(
  payload: Pick<Payload, "find">,
  draft: EngineeringNoteDraft,
  sensitiveFindings: readonly SensitiveContentFinding[],
  mode: TMode,
) {
  await assertEngineeringNoteIsNew(payload, draft);
  const relationships = await resolveEngineeringNoteRelationships(
    payload,
    draft,
  );
  const resolvedRelationshipCount =
    relationships.relatedWorkIds.length +
    relationships.relatedDevelopmentLogIds.length +
    relationships.relatedArchitectureDecisionIds.length +
    (relationships.supersedesArchitectureDecisionId === undefined ? 0 : 1);

  return {
    report: {
      mode,
      draft,
      resolvedRelationshipCount,
      relationshipWarnings: relationships.warnings,
      sensitiveWarnings: sensitiveFindings.filter(
        (finding) => finding.severity === "warning",
      ),
    },
    relationships,
  };
}

async function closePayload(payload: Pick<Payload, "destroy">) {
  try {
    await payload.destroy();
  } catch {
    // 終了処理の内部例外も接続情報を持つ可能性があるため、固定エラーへ変換します。
    throw new EngineeringNoteDatabaseError();
  }
}

/**
 * Phase 4では読取検証だけを行います。Payload型にcreateを含めないことでも、
 * dry-runから誤って書込みAPIを呼べない境界を作っています。
 */
export async function runEngineeringNoteDraftDryRun(input: {
  argv: readonly string[];
  cwd?: string;
  loadPayload: () => Promise<DryRunPayload>;
}): Promise<EngineeringNoteDryRunReport> {
  const args = parseImportCliArguments(input.argv);
  if (args.apply) {
    throw new EngineeringNoteImportCliError("APPLY_NOT_AVAILABLE");
  }

  const draft = await readEngineeringNoteDraftFile(args.file, input.cwd);
  const sensitiveFindings = inspectDraftBeforeDatabase(draft);

  let payload: DryRunPayload;
  try {
    payload = await input.loadPayload();
  } catch {
    throw new EngineeringNoteDatabaseError();
  }

  try {
    const { report } = await buildPreflightReport(
      payload,
      draft,
      sensitiveFindings,
      "dry-run",
    );
    return report satisfies EngineeringNoteDryRunReport;
  } finally {
    await closePayload(payload);
  }
}

/** `--apply`時だけ、全事前検証の成功後にcreate-only登録を1回呼び出します。 */
export async function runEngineeringNoteDraftApply(input: {
  argv: readonly string[];
  cwd?: string;
  loadPayload: () => Promise<ApplyPayload>;
  onBeforeCreate?: (
    report: EngineeringNoteApplyPreview,
  ) => Promise<void> | void;
}) {
  const args = parseImportCliArguments(input.argv);
  if (!args.apply) {
    throw new EngineeringNoteImportCliError("INVALID_ARGUMENTS");
  }

  const draft = await readEngineeringNoteDraftFile(args.file, input.cwd);
  const sensitiveFindings = inspectDraftBeforeDatabase(draft);
  let payload: ApplyPayload;
  try {
    payload = await input.loadPayload();
  } catch {
    throw new EngineeringNoteDatabaseError();
  }

  try {
    const { report, relationships } = await buildPreflightReport(
      payload,
      draft,
      sensitiveFindings,
      "apply",
    );
    const applyPreview = report satisfies EngineeringNoteApplyPreview;

    // このcallbackが作成より先に完了するため、CLIは最終識別子と固定状態を直前表示できます。
    await input.onBeforeCreate?.(applyPreview);
    const created = await createEngineeringNoteDraft(
      payload,
      draft,
      relationships,
    );
    return { created, report: applyPreview };
  } finally {
    await closePayload(payload);
  }
}

/** script用の入口です。`--apply`の有無だけで副作用なし／create-onlyへ明示分岐します。 */
export async function runEngineeringNoteDraftImport(input: {
  argv: readonly string[];
  cwd?: string;
  loadPayload: () => Promise<ApplyPayload>;
  onBeforeCreate?: (
    report: EngineeringNoteApplyPreview,
  ) => Promise<void> | void;
}) {
  const args = parseImportCliArguments(input.argv);

  if (args.apply) {
    const result = await runEngineeringNoteDraftApply(input);
    return { mode: "apply" as const, ...result };
  }

  const report = await runEngineeringNoteDraftDryRun(input);
  return { mode: "dry-run" as const, report };
}

/** 本文を一切参照せず、dry-runで利用者が判断するための識別子と件数だけを整形します。 */
export function formatEngineeringNoteDryRunReport(
  report: EngineeringNoteDryRunReport,
) {
  const lines = [
    `mode: ${report.mode}`,
    `kind: ${report.draft.kind}`,
    `project: ${report.draft.project}`,
    `slug: ${report.draft.slug}`,
  ];

  if (report.draft.kind === "architecture-decision") {
    lines.push(`decision-id: ${report.draft.decisionId}`);
  }

  lines.push(
    "duplicate: none",
    `relationships: ${report.resolvedRelationshipCount} resolved, ${report.relationshipWarnings.length} warning`,
    `sensitive-content: ${report.sensitiveWarnings.length === 0 ? "none" : `${report.sensitiveWarnings.length} warning`}`,
    "status: draft",
    "visibility: private",
    "payload-draft: true",
  );

  for (const warning of report.relationshipWarnings) {
    lines.push(
      `relationship-warning: ${warning.path} ${warning.code} ${warning.relation}`,
    );
  }
  for (const warning of report.sensitiveWarnings) {
    lines.push(
      `sensitive-warning: ${warning.path} ${warning.reason} ${warning.severity}`,
    );
  }

  lines.push("result: ready to create as draft + private");
  return lines.join("\n");
}

/** create直前に、本文を含めずCollectionを決めるkindと固定状態を再表示します。 */
export function formatEngineeringNoteApplyPreview(
  report: EngineeringNoteApplyPreview,
) {
  const lines = [
    `mode: ${report.mode}`,
    `kind: ${report.draft.kind}`,
    `collection: ${report.draft.kind === "development-log" ? "development-logs" : "architecture-decisions"}`,
    `project: ${report.draft.project}`,
    `slug: ${report.draft.slug}`,
  ];

  if (report.draft.kind === "architecture-decision") {
    lines.push(`decision-id: ${report.draft.decisionId}`);
  }

  lines.push(
    "duplicate: none",
    `relationships: ${report.resolvedRelationshipCount} resolved, ${report.relationshipWarnings.length} warning`,
    `sensitive-content: ${report.sensitiveWarnings.length === 0 ? "none" : `${report.sensitiveWarnings.length} warning`}`,
    "status: draft",
    "visibility: private",
    "payload-draft: true",
    "action: create one draft",
  );

  for (const warning of report.relationshipWarnings) {
    lines.push(
      `relationship-warning: ${warning.path} ${warning.code} ${warning.relation}`,
    );
  }
  for (const warning of report.sensitiveWarnings) {
    lines.push(
      `sensitive-warning: ${warning.path} ${warning.reason} ${warning.severity}`,
    );
  }
  return lines.join("\n");
}

/** 作成後もDocument本文を参照せず、登録確認に必要な識別子だけを表示します。 */
export function formatEngineeringNoteCreateSuccess(
  created: CreatedEngineeringNoteDraft,
) {
  return [
    "result: created",
    `document-id: ${created.id}`,
    `kind: ${created.kind}`,
    `slug: ${created.slug}`,
    ...(created.decisionId ? [`decision-id: ${created.decisionId}`] : []),
  ].join("\n");
}

/** 既知エラーだけをallowlist形式で表示し、未知例外のmessageやstackは外へ出しません。 */
export function formatEngineeringNoteImportError(error: unknown) {
  if (error instanceof EngineeringNoteImportCliError) {
    const lines = [`error: ${error.code}`];
    for (const issue of error.inputIssues) {
      lines.push(`field: ${issue.path} ${issue.code}`);
    }
    for (const finding of error.sensitiveFindings) {
      lines.push(
        `sensitive-content: ${finding.path} ${finding.reason} ${finding.severity}`,
      );
    }
    lines.push("result: not created");
    return lines.join("\n");
  }

  if (error instanceof DuplicateEngineeringNoteError) {
    const lines = ["error: DUPLICATE_ENGINEERING_NOTE"];
    for (const duplicate of error.duplicates) {
      lines.push(
        [
          "existing:",
          duplicate.collection,
          `field=${duplicate.field}`,
          `id=${duplicate.id}`,
          `slug=${duplicate.slug}`,
          ...(duplicate.decisionId
            ? [`decision-id=${duplicate.decisionId}`]
            : []),
        ].join(" "),
      );
    }
    lines.push("result: not created");
    return lines.join("\n");
  }

  if (error instanceof RelationshipIntegrityError) {
    return [
      `error: ${error.code}`,
      `relationship: ${error.detail.path} ${error.detail.relation} multiple-matches`,
      "result: not created",
    ].join("\n");
  }

  if (error instanceof EngineeringNoteDatabaseError) {
    return [`error: ${error.code}`, "result: not created"].join("\n");
  }

  if (error instanceof EngineeringNoteCreateError) {
    return [`error: ${error.code}`, "result: not created"].join("\n");
  }

  return ["error: INTERNAL_ERROR", "result: not created"].join("\n");
}
