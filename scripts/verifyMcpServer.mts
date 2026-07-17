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
    assert.doesNotMatch(serializedLogs, /plan-engineering-notes-pages/);
    assert.match(serializedDecisions, /initially-consider-mongodb/);
    assert.doesNotMatch(serializedDecisions, /remote-mcp-authorization/);

    const invalid = await client.callTool({
      name: "search_development_logs",
      arguments: { from: "not-a-date" },
    });
    assert.equal(invalid.isError, true);

    assert.match(stderr, /stdio transportへ接続しました/);
    console.info(
      "MCP verified: 6 tools, structured output, private access, draft exclusion, and clean stdio.",
    );
  } finally {
    await client.close();
  }
}
