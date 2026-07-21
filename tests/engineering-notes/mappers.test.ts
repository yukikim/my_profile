import assert from "node:assert/strict";
import test from "node:test";
import type { ArchitectureDecision, DevelopmentLog } from "../../payload-types";
import {
  mapArchitectureDecision,
  mapDevelopmentLog,
} from "../../lib/engineering-notes/mappers";

test("開発日誌Mapperはallowlist外の値を返さない", () => {
  const input = {
    id: 1,
    title: "テスト日誌",
    slug: "test-log",
    logDate: "2026-07-17T00:00:00.000Z",
    project: "my_profile",
    summary: "概要",
    relatedDecisions: [9],
    status: "published",
    visibility: "public",
    createdAt: "2026-07-17T00:00:00.000Z",
    updatedAt: "2026-07-17T00:00:00.000Z",
    secret: "返してはいけない値",
  } as DevelopmentLog & { secret: string };

  const result = mapDevelopmentLog(input);

  assert.equal(result.title, "テスト日誌");
  assert.equal("secret" in result, false);
  assert.equal("createdAt" in result, false);
  assert.deepEqual(result.nextActions, []);
  assert.deepEqual(result.relatedDecisionIds, []);
});

test("ADR Mapperはarrayとrelationshipを安全な形式へ変換する", () => {
  const input = {
    id: 2,
    decisionId: "ADR-0002",
    title: "PostgreSQLを採用する",
    slug: "choose-postgresql",
    project: "my_profile",
    decisionStatus: "accepted",
    context: "背景",
    options: [
      {
        name: "PostgreSQL",
        pros: [{ item: "SQLを利用できる" }],
        cons: [{ item: "migrationが必要" }],
      },
    ],
    decision: "PostgreSQLを採用する",
    rationale: "既存知識を再利用できるため",
    relatedWorks: [
      {
        id: 3,
        title: "プロフィールサイト",
        slug: "profile-site",
      },
      4,
    ],
    relatedLogs: [5],
    supersedes: 6,
    status: "published",
    visibility: "public",
    createdAt: "2026-07-17T00:00:00.000Z",
    updatedAt: "2026-07-17T00:00:00.000Z",
  } as ArchitectureDecision;

  const result = mapArchitectureDecision(input);

  assert.deepEqual(result.options[0]?.pros, ["SQLを利用できる"]);
  assert.deepEqual(result.relatedWorks, [
    { slug: "profile-site", title: "プロフィールサイト" },
  ]);
  assert.deepEqual(result.relatedLogSlugs, []);
  assert.equal(result.supersedesDecisionId, undefined);
  assert.equal("status" in result, false);
});
