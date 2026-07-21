import assert from "node:assert/strict";
import test from "node:test";
import type { Payload } from "payload";
import {
  assertEngineeringNoteIsNew,
  DuplicateEngineeringNoteError,
  findEngineeringNoteDuplicates,
} from "../../lib/engineering-notes/drafts/duplicates";
import { EngineeringNoteDatabaseError } from "../../lib/engineering-notes/drafts/errors";
import {
  RelationshipIntegrityError,
  resolveEngineeringNoteRelationships,
} from "../../lib/engineering-notes/drafts/relationships";
import {
  hasBlockingSensitiveContent,
  inspectSensitiveContent,
} from "../../lib/engineering-notes/drafts/sensitiveContent";
import type {
  ArchitectureDecisionDraft,
  DevelopmentLogDraft,
} from "../../lib/engineering-notes/drafts/types";

type LookupPayload = Pick<Payload, "find">;

const developmentLogDraft = {
  kind: "development-log",
  title: "Repositoryを追加",
  slug: "go-todo-add-repository",
  logDate: "2026-07-21T00:00:00.000Z",
  project: "go-todo",
  summary: "PostgreSQL repositoryを追加した。",
  relatedWorkSlugs: ["go-todo"],
  relatedDecisionIds: ["GO-TODO-ADR-0001"],
} satisfies DevelopmentLogDraft;

const architectureDecisionDraft = {
  kind: "architecture-decision",
  decisionId: "GO-TODO-ADR-0002",
  title: "Migration toolを選ぶ",
  slug: "go-todo-choose-migration-tool",
  project: "go-todo",
  decisionStatus: "accepted",
  context: "schema変更を再現可能にする必要がある。",
  options: [{ name: "goose" }],
  decision: "gooseを採用する。",
  rationale: "SQLを明示的に管理できるため。",
  supersedesDecisionId: "GO-TODO-ADR-0001",
  relatedWorkSlugs: ["go-todo"],
  relatedLogSlugs: ["go-todo-add-repository"],
} satisfies ArchitectureDecisionDraft;

function fakePayload(
  find: (args: Parameters<Payload["find"]>[0]) => Promise<unknown>,
) {
  return { find } as unknown as LookupPayload;
}

function result(docs: unknown[]) {
  return { docs, totalDocs: docs.length };
}

test("入れ子の秘密情報候補を検出し、結果へ秘密値を含めない", () => {
  const secret = "sk-example_12345678901234567890";
  const findings = inspectSensitiveContent({
    options: [{ description: `API key = ${secret}` }],
    connection: "postgresql://app:password@localhost:5432/app",
    key: "-----BEGIN PRIVATE KEY-----\nprivate-material",
  });
  const serialized = JSON.stringify(findings);

  assert.equal(hasBlockingSensitiveContent(findings), true);
  assert.ok(
    findings.some((finding) => finding.path === "$.options[0].description"),
  );
  assert.ok(
    findings.some((finding) => finding.reason === "database-connection-string"),
  );
  assert.ok(findings.some((finding) => finding.reason === "private-key"));
  assert.equal(serialized.includes(secret), false);
  assert.equal(serialized.includes("postgresql://"), false);
  assert.equal(serialized.includes("private-material"), false);
});

test("長大な本文、stack trace、コード全文候補を警告として区別する", () => {
  const source = Array.from(
    { length: 20 },
    (_, index) => `export const value${index} = ${index};`,
  ).join("\n");
  const findings = inspectSensitiveContent({
    env: "PORT=3000",
    long: "a".repeat(4_000),
    stack:
      "Error: failed\n    at first (app.ts:1:1)\n    at second (app.ts:2:1)",
    source,
  });

  assert.ok(findings.some((finding) => finding.reason === "long-content"));
  assert.ok(findings.some((finding) => finding.reason === "stack-trace"));
  assert.ok(findings.some((finding) => finding.reason === "source-code"));
  assert.ok(findings.some((finding) => finding.reason === "environment-value"));
  assert.ok(findings.every((finding) => finding.severity === "warning"));
});

test("Development Log slugの重複を安全な識別子だけで拒否する", async () => {
  const payload = fakePayload(async () =>
    result([
      {
        id: 10,
        slug: developmentLogDraft.slug,
        summary: "既存本文は結果へ出さない",
      },
    ]),
  );

  const duplicates = await findEngineeringNoteDuplicates(
    payload,
    developmentLogDraft,
  );
  assert.deepEqual(duplicates, [
    {
      collection: "development-logs",
      field: "slug",
      id: 10,
      slug: developmentLogDraft.slug,
    },
  ]);
  await assert.rejects(
    assertEngineeringNoteIsNew(payload, developmentLogDraft),
    DuplicateEngineeringNoteError,
  );
  assert.equal(JSON.stringify(duplicates).includes("既存本文"), false);
});

test("ADR slugとdecisionIdの重複を両方拒否する", async () => {
  const payload = fakePayload(async (args) => {
    const where = args.where as Record<string, unknown>;
    return result([
      {
        id: "slug" in where ? 20 : 21,
        slug: architectureDecisionDraft.slug,
        decisionId: architectureDecisionDraft.decisionId,
      },
    ]);
  });

  const duplicates = await findEngineeringNoteDuplicates(
    payload,
    architectureDecisionDraft,
  );
  assert.deepEqual(
    duplicates.map(({ field }) => field),
    ["slug", "decisionId"],
  );
  await assert.rejects(
    assertEngineeringNoteIsNew(payload, architectureDecisionDraft),
    DuplicateEngineeringNoteError,
  );
});

test("Work、Development Log、ADR、supersedesをDocument IDへ解決する", async () => {
  const ids = {
    works: 100,
    "development-logs": 200,
    "architecture-decisions": 300,
  } as const;
  const payload = fakePayload(async (args) =>
    result([{ id: ids[args.collection as keyof typeof ids] }]),
  );

  const developmentResult = await resolveEngineeringNoteRelationships(
    payload,
    developmentLogDraft,
  );
  assert.deepEqual(developmentResult.relatedWorkIds, [100]);
  assert.deepEqual(developmentResult.relatedArchitectureDecisionIds, [300]);

  const adrResult = await resolveEngineeringNoteRelationships(
    payload,
    architectureDecisionDraft,
  );
  assert.deepEqual(adrResult.relatedWorkIds, [100]);
  assert.deepEqual(adrResult.relatedDevelopmentLogIds, [200]);
  assert.equal(adrResult.supersedesArchitectureDecisionId, 300);
  assert.deepEqual(adrResult.warnings, []);
});

test("relationship未指定と0件を正常に扱い、外部Work不足は警告にする", async () => {
  const payload = fakePayload(async () => result([]));
  const withoutRelationships: DevelopmentLogDraft = {
    ...developmentLogDraft,
    relatedWorkSlugs: undefined,
    relatedDecisionIds: undefined,
  };

  const empty = await resolveEngineeringNoteRelationships(
    payload,
    withoutRelationships,
  );
  assert.deepEqual(empty.warnings, []);

  const missing = await resolveEngineeringNoteRelationships(
    payload,
    developmentLogDraft,
  );
  assert.deepEqual(
    missing.warnings.map(({ code, path }) => ({ code, path })),
    [
      { code: "RELATION_NOT_FOUND", path: "$.relatedWorkSlugs[0]" },
      { code: "RELATION_NOT_FOUND", path: "$.relatedDecisionIds[0]" },
    ],
  );
});

test("relationship複数件をデータ不整合として拒否する", async () => {
  const payload = fakePayload(async () => result([{ id: 1 }, { id: 2 }]));

  await assert.rejects(
    resolveEngineeringNoteRelationships(payload, developmentLogDraft),
    (error: unknown) => {
      assert.ok(error instanceof RelationshipIntegrityError);
      assert.equal(error.detail.matchCount, 2);
      return true;
    },
  );
});

test("DB例外を接続情報、SQL、元stackを含まない安全なエラーへ変換する", async () => {
  const unsafe =
    "postgresql://admin:secret@db:5432/app SQL SELECT * FROM private stack";
  const payload = fakePayload(async () => {
    throw new Error(unsafe);
  });

  for (const operation of [
    findEngineeringNoteDuplicates(payload, developmentLogDraft),
    resolveEngineeringNoteRelationships(payload, developmentLogDraft),
  ]) {
    await assert.rejects(operation, (error: unknown) => {
      assert.ok(error instanceof EngineeringNoteDatabaseError);
      assert.equal(error.code, "DATABASE_UNAVAILABLE");
      assert.equal(error.message.includes(unsafe), false);
      assert.equal("cause" in error, false);
      return true;
    });
  }
});
