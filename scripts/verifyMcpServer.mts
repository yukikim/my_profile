import assert from "node:assert/strict";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);
const projectRoot = path.resolve(dirname, "..");

/** undefinedを除外し、子MCPプロセスへ現在の環境変数を安全な文字列mapとして渡します。 */
const childEnvironment = Object.fromEntries(
  Object.entries(process.env).filter(
    (entry): entry is [string, string] => entry[1] !== undefined,
  ),
);

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});

/**
 * 実際にstdio子プロセスを起動し、MCP Clientから6 Toolと実DBの信頼境界を検証します。
 * stdoutへ通常ログが混ざるとJSON-RPCの解析が失敗するため、この検証自体がstdout純度の確認にもなります。
 */
async function main() {
  const transport = new StdioClientTransport({
    command: process.execPath,
    args: ["--import", "tsx", "mcp/server.ts"],
    cwd: projectRoot,
    env: childEnvironment,
    stderr: "pipe",
  });
  const client = new Client({
    name: "engineering-notes-stdio-verifier",
    version: "1.0.0",
  });
  let stderr = "";

  // stderrは診断確認だけに使い、検証結果へDB接続情報などを再出力しません。
  transport.stderr?.on("data", (chunk: Buffer | string) => {
    stderr += chunk.toString();
  });

  await client.connect(transport);

  try {
    const listed = await client.listTools();
    assert.equal(listed.tools.length, 6);
    assert.ok(listed.tools.every((tool) => tool.annotations?.readOnlyHint));

    const toolCalls = [
      ["search_development_logs", { project: "my_profile" }],
      ["get_recent_development_logs", { project: "my_profile", days: 30 }],
      ["search_architecture_decisions", { project: "my_profile" }],
      ["get_project_history", { project: "my_profile" }],
      ["get_decision_context", { decisionId: "ADR-0002" }],
      [
        "get_related_decisions",
        { decisionId: "ADR-0002", includeSuperseded: true },
      ],
    ] as const;

    for (const [name, args] of toolCalls) {
      const result = await client.callTool({ name, arguments: args });
      assert.equal(result.isError, undefined, `${name} should succeed`);
      assert.ok(result.structuredContent, `${name} should be structured`);
    }

    const logs = await client.callTool({
      name: "search_development_logs",
      arguments: { project: "my_profile", visibility: "all", limit: 50 },
    });
    const decisions = await client.callTool({
      name: "search_architecture_decisions",
      arguments: { project: "my_profile", visibility: "all", limit: 50 },
    });
    const serializedLogs = JSON.stringify(logs.structuredContent);
    const serializedDecisions = JSON.stringify(decisions.structuredContent);

    assert.match(serializedLogs, /investigate-works-fallback/);
    assert.match(serializedDecisions, /initially-consider-mongodb/);

    // 管理画面で後日公開され得る特定draftのslugへ依存せず、公開境界はQuery Serviceの単体検証と
    // 下記のprivate/public受け入れデータで継続確認します。

    // Phase 6の受け入れデータを実MCPへ通し、project絞り込みと相互参照を同時に確認します。
    const externalLogs = await client.callTool({
      name: "search_development_logs",
      arguments: { project: "go-todo", visibility: "all", limit: 50 },
    });
    const externalDecisions = await client.callTool({
      name: "search_architecture_decisions",
      arguments: { project: "go-todo", visibility: "all", limit: 50 },
    });
    const externalHistory = await client.callTool({
      name: "get_project_history",
      arguments: { project: "go-todo", limit: 50 },
    });
    const serializedExternalLogs = JSON.stringify(
      externalLogs.structuredContent,
    );
    const serializedExternalDecisions = JSON.stringify(
      externalDecisions.structuredContent,
    );
    const serializedExternalHistory = JSON.stringify(
      externalHistory.structuredContent,
    );

    assert.match(serializedExternalLogs, /go-todo-split-layered-packages/);
    assert.match(serializedExternalLogs, /GO-TODO-ADR-0002/);
    assert.doesNotMatch(serializedExternalLogs, /payload-sample/);
    assert.match(
      serializedExternalDecisions,
      /go-todo-choose-postgresql-repository/,
    );
    assert.match(serializedExternalDecisions, /GO-TODO-ADR-0002/);
    assert.match(serializedExternalDecisions, /go-todo-split-layered-packages/);
    assert.match(serializedExternalHistory, /go-todo-split-layered-packages/);
    assert.match(serializedExternalHistory, /GO-TODO-ADR-0002/);

    // 履歴は種別を統合した後も日付の降順を保つ必要があります。
    const historyItems = (
      externalHistory.structuredContent as {
        items: Array<{ date: string | null }>;
      }
    ).items;
    for (let index = 1; index < historyItems.length; index += 1) {
      assert.ok(
        (historyItems[index - 1]?.date ?? "") >=
          (historyItems[index]?.date ?? ""),
      );
    }

    const invalid = await client.callTool({
      name: "search_development_logs",
      arguments: { from: "not-a-date" },
    });
    assert.equal(invalid.isError, true);

    assert.match(stderr, /stdio transportへ接続しました/);
    console.info(
      "MCP verified: 6 tools, structured output, private access, cross-project history, and clean stdio.",
    );
  } finally {
    await client.close();
  }
}
