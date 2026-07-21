import assert from "node:assert/strict";
import test from "node:test";
import type { Payload } from "payload";
import {
  createEngineeringNoteDraft,
  EngineeringNoteCreateError,
} from "../../lib/engineering-notes/drafts/createDraft";
import type { ResolvedEngineeringNoteRelationships } from "../../lib/engineering-notes/drafts/relationships";
import type {
  ArchitectureDecisionDraft,
  DevelopmentLogDraft,
} from "../../lib/engineering-notes/drafts/types";

const relationships = {
  relatedWorkIds: [10],
  relatedDevelopmentLogIds: [20],
  relatedArchitectureDecisionIds: [30],
  supersedesArchitectureDecisionId: 40,
  warnings: [],
} satisfies ResolvedEngineeringNoteRelationships;

function capturingPayload(documentId: number) {
  const createArguments: unknown[] = [];
  const payload = {
    create: async (args: unknown) => {
      createArguments.push(args);
      return { id: documentId };
    },
  } as unknown as Pick<Payload, "create">;

  return { createArguments, payload };
}

test("Development LogをCollection構造へ変換し、非公開Payload draftとして作成する", async () => {
  const draft = {
    kind: "development-log",
    title: "下書き登録を追加",
    slug: "my-profile-add-draft-creation",
    logDate: "2026-07-21T00:00:00.000Z",
    project: "my_profile",
    summary: "create-onlyの登録処理を追加した。",
    implementation: "Payload Local APIのcreateだけを利用した。",
    nextActions: ["管理画面で内容を確認する。"],
    tags: ["payload", "draft"],
  } satisfies DevelopmentLogDraft;
  const { createArguments, payload } = capturingPayload(101);

  const created = await createEngineeringNoteDraft(
    payload,
    draft,
    relationships,
  );
  const args = createArguments[0] as {
    collection: string;
    data: Record<string, unknown>;
    draft: boolean;
    overrideAccess: boolean;
  };

  assert.deepEqual(created, {
    id: 101,
    kind: "development-log",
    slug: draft.slug,
  });
  assert.equal(args.collection, "development-logs");
  assert.equal(args.draft, true);
  assert.equal(args.overrideAccess, true);
  assert.equal(args.data.status, "draft");
  assert.equal(args.data.visibility, "private");
  assert.deepEqual(args.data.nextActions, [
    { task: "管理画面で内容を確認する。" },
  ]);
  assert.deepEqual(args.data.tags, [{ label: "payload" }, { label: "draft" }]);
  assert.deepEqual(args.data.relatedWorks, [10]);
  assert.deepEqual(args.data.relatedDecisions, [30]);
  assert.equal("publishedAt" in args.data, false);
});

test("ADRの入れ子配列と全relationshipをPayload形式へ変換する", async () => {
  const draft = {
    kind: "architecture-decision",
    decisionId: "MY-PROFILE-ADR-0003",
    title: "登録に明示的なapplyを要求する",
    slug: "my-profile-require-explicit-apply",
    project: "my_profile",
    decisionStatus: "accepted",
    context: "意図しない登録を防ぐ必要がある。",
    options: [
      {
        name: "明示的なapply",
        description: "dry-runと作成を分離する。",
        pros: ["実行者が直前状態を確認できる。"],
        cons: ["コマンドが2段階になる。"],
      },
    ],
    decision: "--applyがある場合だけ作成する。",
    rationale: "通常実行を副作用なしに保てるため。",
    positiveConsequences: ["誤登録を防げる。"],
    negativeConsequences: ["操作が1回増える。"],
    tags: ["cli"],
  } satisfies ArchitectureDecisionDraft;
  const { createArguments, payload } = capturingPayload(202);

  const created = await createEngineeringNoteDraft(
    payload,
    draft,
    relationships,
  );
  const args = createArguments[0] as {
    collection: string;
    data: Record<string, unknown>;
  };

  assert.deepEqual(created, {
    id: 202,
    kind: "architecture-decision",
    slug: draft.slug,
    decisionId: draft.decisionId,
  });
  assert.equal(args.collection, "architecture-decisions");
  assert.deepEqual(args.data.options, [
    {
      name: "明示的なapply",
      description: "dry-runと作成を分離する。",
      pros: [{ item: "実行者が直前状態を確認できる。" }],
      cons: [{ item: "コマンドが2段階になる。" }],
    },
  ]);
  assert.deepEqual(args.data.positiveConsequences, [
    { item: "誤登録を防げる。" },
  ]);
  assert.deepEqual(args.data.negativeConsequences, [
    { item: "操作が1回増える。" },
  ]);
  assert.equal(args.data.supersedes, 40);
  assert.deepEqual(args.data.relatedWorks, [10]);
  assert.deepEqual(args.data.relatedLogs, [20]);
  assert.equal(args.data.status, "draft");
  assert.equal(args.data.visibility, "private");
});

test("Payload作成エラーを元messageやcauseのない安全なエラーへ変換する", async () => {
  const unsafe = "postgresql://admin:password@db/private INSERT stack";
  const payload = {
    create: async () => {
      throw new Error(unsafe);
    },
  } as unknown as Pick<Payload, "create">;
  const draft = {
    kind: "development-log",
    title: "作成失敗",
    slug: "my-profile-create-failure",
    logDate: "2026-07-21T00:00:00.000Z",
    project: "my_profile",
    summary: "作成失敗を検証する。",
  } satisfies DevelopmentLogDraft;

  await assert.rejects(
    createEngineeringNoteDraft(payload, draft, relationships),
    (error: unknown) => {
      assert.ok(error instanceof EngineeringNoteCreateError);
      assert.equal(error.code, "CREATE_FAILED");
      assert.equal(error.message.includes(unsafe), false);
      assert.equal("cause" in error, false);
      return true;
    },
  );
});
