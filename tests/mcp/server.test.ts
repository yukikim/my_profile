import assert from "node:assert/strict";
import test from "node:test";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import type {
  ArchitectureDecisionResult,
  DevelopmentLogResult,
} from "../../lib/engineering-notes/types";
import type { EngineeringNotesDataSource } from "../../mcp/dataSource";
import { createEngineeringNotesMcpServer } from "../../mcp/serverFactory";

/** privateを含む公開済み日誌のfixtureです。draftはData Source境界より内側で除外される前提です。 */
const developmentLogs: DevelopmentLogResult[] = [
  {
    id: "log-public",
    title: "問い合わせフォームを実装",
    slug: "implement-contact-form",
    logDate: new Date().toISOString(),
    project: "my_profile",
    summary: "フォーム送信を実装した。",
    implementation: "Payload Local APIを使用した。",
    nextActions: ["E2Eテストを追加する"],
    relatedWorks: [{ title: "Profile Site", slug: "profile-site" }],
    relatedDecisionIds: ["ADR-001"],
    tags: ["form"],
    visibility: "public",
  },
  {
    id: "log-private",
    title: "非公開の障害調査",
    slug: "private-incident-note",
    logDate: new Date(Date.now() - 86_400_000).toISOString(),
    project: "my_profile",
    summary: "公開前の調査メモ。",
    nextActions: [],
    relatedWorks: [],
    relatedDecisionIds: [],
    tags: ["incident"],
    visibility: "private",
  },
];

/** 置換関係と共通Workを持つADRのfixtureです。 */
const architectureDecisions: ArchitectureDecisionResult[] = [
  {
    id: "decision-1",
    decisionId: "ADR-001",
    title: "PostgreSQLを採用する",
    slug: "adopt-postgresql",
    project: "my_profile",
    context: "永続データを管理する必要がある。",
    decision: "PostgreSQLを利用する。",
    rationale: "Payloadの公式adapterを利用できるため。",
    options: [],
    positiveConsequences: ["データを永続化できる"],
    negativeConsequences: ["DB運用が必要になる"],
    decisionStatus: "accepted",
    decidedAt: new Date().toISOString(),
    relatedWorks: [{ title: "Profile Site", slug: "profile-site" }],
    relatedLogSlugs: ["implement-contact-form"],
    tags: ["database"],
    visibility: "private",
  },
  {
    id: "decision-0",
    decisionId: "ADR-000",
    title: "MongoDBを検討した",
    slug: "consider-mongodb",
    project: "my_profile",
    context: "初期DB候補を比較した。",
    decision: "後続ADRで置き換える。",
    rationale: "構成を統一するため。",
    options: [],
    positiveConsequences: [],
    negativeConsequences: [],
    decisionStatus: "superseded",
    decidedAt: new Date(Date.now() - 86_400_000).toISOString(),
    relatedWorks: [{ title: "Profile Site", slug: "profile-site" }],
    relatedLogSlugs: [],
    tags: ["database"],
    visibility: "public",
  },
];

/** Toolテストに必要な検索条件だけを忠実に再現するin-memory Data Sourceです。 */
function createFakeDataSource(): EngineeringNotesDataSource {
  return {
    async searchDevelopmentLogs(input) {
      return developmentLogs
        .filter((log) => !input.project || log.project === input.project)
        .filter(
          (log) =>
            !input.query ||
            `${log.title} ${log.summary}`.includes(input.query),
        )
        .filter(
          (log) =>
            !input.relatedWorkSlug ||
            log.relatedWorks.some(
              (work) => work.slug === input.relatedWorkSlug,
            ),
        )
        .filter((log) => !input.from || log.logDate >= input.from)
        .filter((log) => !input.to || log.logDate <= input.to)
        .filter(
          (log) =>
            !input.visibility ||
            input.visibility === "all" ||
            log.visibility === input.visibility,
        )
        .slice(0, input.limit ?? 10);
    },
    async searchArchitectureDecisions(input) {
      return architectureDecisions
        .filter(
          (decision) => !input.project || decision.project === input.project,
        )
        .filter(
          (decision) =>
            !input.query ||
            `${decision.decisionId} ${decision.slug} ${decision.title}`.includes(
              input.query,
            ),
        )
        .filter(
          (decision) =>
            !input.decisionStatus ||
            decision.decisionStatus === input.decisionStatus,
        )
        .filter(
          (decision) =>
            !input.relatedWorkSlug ||
            decision.relatedWorks.some(
              (work) => work.slug === input.relatedWorkSlug,
            ),
        )
        .filter(
          (decision) =>
            !input.visibility ||
            input.visibility === "all" ||
            decision.visibility === input.visibility,
        )
        .slice(0, input.limit ?? 10);
    },
  };
}

/** 実際のMCP初期化handshakeを行い、Client APIだけでToolを検証します。 */
async function withMcpClient(
  dataSource: EngineeringNotesDataSource,
  action: (client: Client) => Promise<void>,
) {
  const server = createEngineeringNotesMcpServer(dataSource);
  const client = new Client({ name: "engineering-notes-test", version: "1.0.0" });
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();

  await server.connect(serverTransport);
  await client.connect(clientTransport);

  try {
    await action(client);
  } finally {
    await client.close();
    await server.close();
  }
}

test("6つの読み取り専用Toolを一覧表示し、すべて正常実行できる", async () => {
  await withMcpClient(createFakeDataSource(), async (client) => {
    const listed = await client.listTools();
    const expectedNames = [
      "get_decision_context",
      "get_project_history",
      "get_recent_development_logs",
      "get_related_decisions",
      "search_architecture_decisions",
      "search_development_logs",
    ];

    assert.deepEqual(
      listed.tools.map((tool) => tool.name).sort(),
      expectedNames,
    );
    assert.ok(listed.tools.every((tool) => tool.annotations?.readOnlyHint));
    assert.ok(listed.tools.every((tool) => tool.outputSchema));

    const calls = [
      ["search_development_logs", {}],
      ["get_recent_development_logs", {}],
      ["search_architecture_decisions", {}],
      ["get_project_history", { project: "my_profile" }],
      ["get_decision_context", { decisionId: "ADR-001" }],
      ["get_related_decisions", { workSlug: "profile-site" }],
    ] as const;

    for (const [name, args] of calls) {
      const result = await client.callTool({ name, arguments: args });
      assert.equal(result.isError, undefined, `${name} should succeed`);
      assert.ok(result.structuredContent, `${name} should be structured`);
    }
  });
});

test("privateを取得でき、0件は空配列として返す", async () => {
  await withMcpClient(createFakeDataSource(), async (client) => {
    const privateResult = await client.callTool({
      name: "search_development_logs",
      arguments: { visibility: "private" },
    });
    const emptyResult = await client.callTool({
      name: "search_development_logs",
      arguments: { query: "__not_found__" },
    });

    assert.match(JSON.stringify(privateResult), /private-incident-note/);
    assert.deepEqual(emptyResult.structuredContent, {
      items: [],
      count: 0,
      query: { visibility: "all", limit: 10, query: "__not_found__" },
    });
  });
});

test("不正日付、空の必須項目、limit上限超過を入力検証で拒否する", async () => {
  await withMcpClient(createFakeDataSource(), async (client) => {
    const invalidCalls = [
      ["search_development_logs", { from: "not-a-date" }],
      ["get_project_history", { project: "   " }],
      ["search_architecture_decisions", { limit: 51 }],
    ] as const;

    for (const [name, args] of invalidCalls) {
      const result = await client.callTool({ name, arguments: args });
      assert.equal(result.isError, true, `${name} should reject invalid input`);
    }
  });
});

test("DB相当の失敗でも接続文字列やstack traceをTool応答へ含めない", async () => {
  const failingDataSource: EngineeringNotesDataSource = {
    async searchDevelopmentLogs() {
      throw new Error("connect ECONNREFUSED postgres://admin:secret@db/internal");
    },
    async searchArchitectureDecisions() {
      throw new Error("SQL SELECT * FROM users; PAYLOAD_SECRET=top-secret");
    },
  };

  await withMcpClient(failingDataSource, async (client) => {
    const result = await client.callTool({
      name: "search_development_logs",
      arguments: {},
    });
    const serialized = JSON.stringify(result);

    assert.equal(result.isError, true);
    assert.match(serialized, /QUERY_FAILED/);
    assert.doesNotMatch(serialized, /postgres|admin|secret|SELECT|stack/i);
  });
});
