import assert from "node:assert/strict";
import test from "node:test";
import { ZodError } from "zod";
import {
  ENGINEERING_NOTE_DRAFT_LIMITS,
  parseEngineeringNoteDraft,
  parseEngineeringNoteDraftJson,
} from "../../lib/engineering-notes/drafts/schemas";
import type {
  ArchitectureDecisionDraft,
  DevelopmentLogDraft,
  EngineeringNoteDraft,
} from "../../lib/engineering-notes/drafts/types";

const developmentLogInput = {
  kind: "development-log",
  title: "Todoの保存先をPostgreSQLへ変更",
  slug: "go-todo-add-postgresql-repository",
  logDate: "2026-07-21T00:00:00.000Z",
  project: "go-todo",
  summary: "メモリ保存をPostgreSQL repositoryへ置き換えた。",
  implementation: "repository interfaceとPostgreSQL実装を追加した。",
  nextActions: ["migration手順をREADMEへ追加する。"],
  relatedWorkSlugs: [],
  relatedDecisionIds: ["GO-TODO-ADR-0001"],
  tags: ["go", "postgresql"],
} satisfies DevelopmentLogDraft;

const architectureDecisionInput = {
  kind: "architecture-decision",
  decisionId: "GO-TODO-ADR-0001",
  title: "Todoの保存先にPostgreSQLを採用する",
  slug: "go-todo-choose-postgresql",
  project: "go-todo",
  decisionStatus: "accepted",
  context: "再起動後もTodoを保持できる永続化方式が必要になった。",
  options: [
    {
      name: "PostgreSQL",
      description: "repository層からPostgreSQLへ保存する。",
      pros: ["SQLの学習につなげられる。"],
      cons: ["ローカルDBの管理が必要になる。"],
    },
  ],
  decision: "PostgreSQLを採用する。",
  rationale: "学習対象と想定する本番構成を統一できるため。",
  decidedAt: "2026-07-21T00:00:00.000Z",
  relatedLogSlugs: ["go-todo-add-postgresql-repository"],
  tags: ["database", "postgresql"],
} satisfies ArchitectureDecisionDraft;

test("Development Logの正常入力を受理する", () => {
  const result = parseEngineeringNoteDraft(developmentLogInput);

  assert.equal(result.kind, "development-log");
  assert.equal(result.slug, "go-todo-add-postgresql-repository");
});

test("ADRの正常入力を受理し、kindで型を絞り込める", () => {
  const result = parseEngineeringNoteDraft(architectureDecisionInput);
  // schema出力がPayload生成型ではなく、登録前JSON専用のunionへ代入できることも型検査します。
  const typedResult: EngineeringNoteDraft = result;

  assert.equal(typedResult.kind, "architecture-decision");
  if (typedResult.kind === "architecture-decision") {
    assert.equal(typedResult.decisionId, "GO-TODO-ADR-0001");
    assert.equal(typedResult.options.length, 1);
  }
});

test("必須項目不足と空文字を拒否する", () => {
  const missingSummary: Record<string, unknown> = { ...developmentLogInput };
  delete missingSummary.summary;

  assert.throws(() => parseEngineeringNoteDraft(missingSummary), ZodError);
  assert.throws(
    () => parseEngineeringNoteDraft({ ...developmentLogInput, title: "  " }),
    ZodError,
  );
});

test("不正な日付、slug、ADR ID、decisionStatusを拒否する", () => {
  const invalidInputs = [
    { ...developmentLogInput, logDate: "2026-07-21" },
    { ...developmentLogInput, logDate: "2026-02-30T00:00:00.000Z" },
    { ...developmentLogInput, slug: "Go_Todo_Invalid" },
    { ...architectureDecisionInput, decisionId: "ADR-1" },
    { ...architectureDecisionInput, decisionStatus: "done" },
  ];

  for (const input of invalidInputs) {
    assert.throws(() => parseEngineeringNoteDraft(input), ZodError);
  }
});

test("空のADR optionsを拒否する", () => {
  assert.throws(
    () =>
      parseEngineeringNoteDraft({ ...architectureDecisionInput, options: [] }),
    ZodError,
  );
});

test("公開状態と未知のfieldを拒否する", () => {
  const invalidInputs = [
    { ...developmentLogInput, status: "published" },
    { ...developmentLogInput, visibility: "public" },
    { ...developmentLogInput, _status: "published" },
    { ...developmentLogInput, unexpected: true },
    {
      ...architectureDecisionInput,
      options: [{ ...architectureDecisionInput.options[0], unexpected: true }],
    },
  ];

  for (const input of invalidInputs) {
    assert.throws(() => parseEngineeringNoteDraft(input), ZodError);
  }
});

test("文字列をtrimし、配列の重複を入力順のまま除去する", () => {
  const result = parseEngineeringNoteDraft({
    ...developmentLogInput,
    title: "  Todoを永続化  ",
    tags: [" go ", "postgresql", "go"],
  });

  assert.equal(result.title, "Todoを永続化");
  assert.deepEqual(result.tags, ["go", "postgresql"]);
});

test("relationshipでは既存の名前空間なしADR IDも受理する", () => {
  const result = parseEngineeringNoteDraft({
    ...developmentLogInput,
    relatedDecisionIds: ["ADR-0002"],
  });

  assert.equal(result.kind, "development-log");
  if (result.kind === "development-log") {
    assert.deepEqual(result.relatedDecisionIds, ["ADR-0002"]);
  }
});

test("配列の空文字、文字数、配列件数の上限を拒否する", () => {
  assert.throws(
    () => parseEngineeringNoteDraft({ ...developmentLogInput, tags: [" "] }),
    ZodError,
  );
  assert.throws(
    () =>
      parseEngineeringNoteDraft({
        ...developmentLogInput,
        summary: "a".repeat(
          ENGINEERING_NOTE_DRAFT_LIMITS.summaryCharacters + 1,
        ),
      }),
    ZodError,
  );
  assert.throws(
    () =>
      parseEngineeringNoteDraft({
        ...developmentLogInput,
        nextActions: Array.from(
          { length: ENGINEERING_NOTE_DRAFT_LIMITS.arrayItems + 1 },
          (_, index) => `task-${index}`,
        ),
      }),
    ZodError,
  );
});

test("JSONのUTF-8 byte数上限をDB接続前に拒否する", () => {
  const json = JSON.stringify(developmentLogInput);
  const atLimitJson = `${json}${" ".repeat(
    ENGINEERING_NOTE_DRAFT_LIMITS.fileBytes - Buffer.byteLength(json, "utf8"),
  )}`;
  const oversizedJson = `${atLimitJson} `;

  assert.equal(
    parseEngineeringNoteDraftJson(atLimitJson).kind,
    "development-log",
  );
  assert.throws(() => parseEngineeringNoteDraftJson(oversizedJson), RangeError);
});
