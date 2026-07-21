import assert from "node:assert/strict";
import test from "node:test";
import {
  findRelatedDecisions,
  findRelatedDevelopmentLogs,
  findSupersededDecision,
} from "../../lib/engineering-notes/public";
import type {
  ArchitectureDecisionResult,
  DevelopmentLogResult,
} from "../../lib/engineering-notes/types";

/** relationshipテストで重要でない項目を既定値で補う開発日誌fixture factoryです。 */
function createLog(
  overrides: Partial<DevelopmentLogResult> = {},
): DevelopmentLogResult {
  return {
    id: "log-1",
    title: "公開日誌",
    slug: "public-log",
    logDate: "2026-07-21T00:00:00.000Z",
    project: "my_profile",
    summary: "概要",
    nextActions: [],
    relatedWorks: [],
    relatedDecisionIds: [],
    tags: [],
    visibility: "public",
    ...overrides,
  };
}

/** ADRの相互リンク条件だけを読みやすく検証するfixture factoryです。 */
function createDecision(
  overrides: Partial<ArchitectureDecisionResult> = {},
): ArchitectureDecisionResult {
  return {
    id: "decision-1",
    decisionId: "ADR-0001",
    title: "公開ADR",
    slug: "public-decision",
    project: "my_profile",
    context: "背景",
    decision: "判断",
    rationale: "理由",
    options: [],
    positiveConsequences: [],
    negativeConsequences: [],
    decisionStatus: "accepted",
    relatedWorks: [],
    relatedLogSlugs: [],
    tags: [],
    visibility: "public",
    ...overrides,
  };
}

test("日誌とADRのどちら側から設定したrelationshipも相互リンクへ反映する", () => {
  const log = createLog({ relatedDecisionIds: ["ADR-0001"] });
  const decisionFromLog = createDecision();
  const decisionFromDecision = createDecision({
    id: "decision-2",
    decisionId: "ADR-0002",
    slug: "second-decision",
    relatedLogSlugs: [log.slug],
  });

  assert.deepEqual(
    findRelatedDecisions(log, [decisionFromLog, decisionFromDecision]).map(
      (decision) => decision.decisionId,
    ),
    ["ADR-0001", "ADR-0002"],
  );
  assert.deepEqual(
    findRelatedDevelopmentLogs(decisionFromLog, [log]).map(
      (item) => item.slug,
    ),
    ["public-log"],
  );
});

test("置換先IDと一致するpublic ADRを返す", () => {
  const oldDecision = createDecision();
  const currentDecision = createDecision({
    id: "decision-2",
    decisionId: "ADR-0002",
    slug: "current-decision",
    supersedesDecisionId: oldDecision.decisionId,
  });

  assert.equal(
    findSupersededDecision(currentDecision, [oldDecision, currentDecision]),
    oldDecision,
  );
});
