import assert from "node:assert/strict";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test, { type TestContext } from "node:test";
import type { Payload } from "payload";
import {
  EngineeringNoteImportCliError,
  formatEngineeringNoteDryRunReport,
  formatEngineeringNoteImportError,
  parseImportCliArguments,
  readEngineeringNoteDraftFile,
  runEngineeringNoteDraftDryRun,
} from "../../lib/engineering-notes/drafts/importCli";
import type {
  ArchitectureDecisionDraft,
  DevelopmentLogDraft,
} from "../../lib/engineering-notes/drafts/types";

const validDraft = {
  kind: "development-log",
  title: "dry-run CLIを追加",
  slug: "my-profile-add-dry-run-cli",
  logDate: "2026-07-21T00:00:00.000Z",
  project: "my_profile",
  summary: "登録前検証を行うCLIを追加した。",
  relatedWorkSlugs: ["my-profile"],
  relatedDecisionIds: ["ADR-0001"],
} satisfies DevelopmentLogDraft;

const validArchitectureDecisionDraft = {
  kind: "architecture-decision",
  decisionId: "MY-PROFILE-ADR-0003",
  title: "下書き登録にdry-runを必須とする",
  slug: "my-profile-require-dry-run",
  project: "my_profile",
  decisionStatus: "accepted",
  context: "Payloadへ書き込む前に内容を確認する必要がある。",
  options: [{ name: "dry-runを必須にする" }],
  decision: "確認用dry-runと登録処理を分離する。",
  rationale: "意図しない登録を防げるため。",
} satisfies ArchitectureDecisionDraft;

async function fixtureFile(t: TestContext, content: string) {
  const directory = await mkdtemp(path.join(os.tmpdir(), "engineering-note-"));
  t.after(() => rm(directory, { recursive: true }));
  const file = path.join(directory, "draft.json");
  await writeFile(file, content, "utf8");
  return { directory, file };
}

function emptyFindResult() {
  return {
    docs: [],
    hasNextPage: false,
    hasPrevPage: false,
    limit: 10,
    nextPage: null,
    page: 1,
    pagingCounter: 1,
    prevPage: null,
    totalDocs: 0,
    totalPages: 1,
  };
}

function fakePayload() {
  const calls = { create: 0, destroy: 0, find: 0 };
  const payload = {
    create: async () => {
      calls.create += 1;
      return {};
    },
    destroy: async () => {
      calls.destroy += 1;
    },
    find: async () => {
      calls.find += 1;
      return emptyFindResult();
    },
  } as unknown as Payload;

  return { calls, payload };
}

test("--fileを必須とし、未知option・位置引数・重複optionを拒否する", () => {
  assert.throws(
    () => parseImportCliArguments([]),
    (error: unknown) =>
      error instanceof EngineeringNoteImportCliError &&
      error.code === "MISSING_FILE",
  );

  for (const argv of [
    ["--unknown"],
    ["draft.json"],
    ["--file", "a.json", "--file=b.json"],
  ]) {
    assert.throws(
      () => parseImportCliArguments(argv),
      (error: unknown) =>
        error instanceof EngineeringNoteImportCliError &&
        error.code === "INVALID_ARGUMENTS",
    );
  }
});

test("絶対パスとcwdから解決する相対パスの通常ファイルを読み込む", async (t) => {
  const { directory, file } = await fixtureFile(t, JSON.stringify(validDraft));

  const absolute = await readEngineeringNoteDraftFile(file);
  const relative = await readEngineeringNoteDraftFile("draft.json", directory);

  assert.equal(absolute.slug, validDraft.slug);
  assert.equal(relative.slug, validDraft.slug);
});

test("存在しないファイルとdirectoryを拒否する", async (t) => {
  const { directory } = await fixtureFile(t, JSON.stringify(validDraft));

  await assert.rejects(
    readEngineeringNoteDraftFile(path.join(directory, "missing.json")),
    (error: unknown) =>
      error instanceof EngineeringNoteImportCliError &&
      error.code === "FILE_NOT_FOUND",
  );
  await assert.rejects(
    readEngineeringNoteDraftFile(directory),
    (error: unknown) =>
      error instanceof EngineeringNoteImportCliError &&
      error.code === "FILE_NOT_REGULAR",
  );
});

test("JSON解析エラーを本文やparser messageを含まない固定エラーにする", async (t) => {
  const unsafe = "postgresql://admin:secret@db:5432/private";
  const { file } = await fixtureFile(t, `{ invalid: "${unsafe}" }`);

  await assert.rejects(readEngineeringNoteDraftFile(file), (error: unknown) => {
    const output = formatEngineeringNoteImportError(error);
    assert.match(output, /error: INVALID_JSON/);
    assert.equal(output.includes(unsafe), false);
    assert.equal(output.includes("SyntaxError"), false);
    return true;
  });
});

test("schema違反を安全なフィールド単位で表示する", async (t) => {
  const invalid: Record<string, unknown> = { ...validDraft };
  delete invalid.summary;
  invalid.status = "published";
  const { file } = await fixtureFile(t, JSON.stringify(invalid));

  await assert.rejects(readEngineeringNoteDraftFile(file), (error: unknown) => {
    const output = formatEngineeringNoteImportError(error);
    assert.match(output, /error: INVALID_INPUT/);
    assert.match(output, /field: \$\.summary invalid_type/);
    assert.match(output, /field: \$\.status unrecognized_keys/);
    assert.equal(output.includes("published"), false);
    return true;
  });
});

test("秘密情報候補をPayload初期化前に拒否し、秘密値を表示しない", async (t) => {
  const secret = "super-secret-password-value";
  const { file } = await fixtureFile(
    t,
    JSON.stringify({ ...validDraft, summary: `password=${secret}` }),
  );
  let loadCount = 0;

  await assert.rejects(
    runEngineeringNoteDraftDryRun({
      argv: ["--file", file],
      loadPayload: async () => {
        loadCount += 1;
        return fakePayload().payload;
      },
    }),
    (error: unknown) => {
      const output = formatEngineeringNoteImportError(error);
      assert.match(output, /error: SENSITIVE_CONTENT/);
      assert.match(output, /\$\.summary credential-value block/);
      assert.equal(output.includes(secret), false);
      return true;
    },
  );
  assert.equal(loadCount, 0);
});

test("dry-runはPhase 3検証と固定公開状態を表示し、payload.createを呼ばない", async (t) => {
  const { file } = await fixtureFile(t, JSON.stringify(validDraft));
  const { calls, payload } = fakePayload();

  const report = await runEngineeringNoteDraftDryRun({
    argv: [`--file=${file}`],
    loadPayload: async () => payload,
  });
  const output = formatEngineeringNoteDryRunReport(report);

  assert.match(output, /mode: dry-run/);
  assert.match(output, /kind: development-log/);
  assert.match(output, /project: my_profile/);
  assert.match(output, /slug: my-profile-add-dry-run-cli/);
  assert.match(output, /duplicate: none/);
  assert.match(output, /relationships: 0 resolved, 2 warning/);
  assert.match(output, /status: draft/);
  assert.match(output, /visibility: private/);
  assert.match(output, /payload-draft: true/);
  assert.equal(calls.create, 0);
  assert.equal(calls.find, 3);
  assert.equal(calls.destroy, 1);
});

test("ADRのdry-runにはslugとdecision IDを表示する", async (t) => {
  const { file } = await fixtureFile(
    t,
    JSON.stringify(validArchitectureDecisionDraft),
  );
  const { payload } = fakePayload();

  const report = await runEngineeringNoteDraftDryRun({
    argv: ["--file", file],
    loadPayload: async () => payload,
  });
  const output = formatEngineeringNoteDryRunReport(report);

  assert.match(output, /slug: my-profile-require-dry-run/);
  assert.match(output, /decision-id: MY-PROFILE-ADR-0003/);
});

test("Phase 4では--applyを明示的に拒否し、DBへ接続しない", async (t) => {
  const { file } = await fixtureFile(t, JSON.stringify(validDraft));
  let loadCount = 0;

  await assert.rejects(
    runEngineeringNoteDraftDryRun({
      argv: ["--file", file, "--apply"],
      loadPayload: async () => {
        loadCount += 1;
        return fakePayload().payload;
      },
    }),
    (error: unknown) =>
      error instanceof EngineeringNoteImportCliError &&
      error.code === "APPLY_NOT_AVAILABLE",
  );
  assert.equal(loadCount, 0);
});
