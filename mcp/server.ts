import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { closeMcpPayload } from "./payload";
import { createEngineeringNotesMcpServer } from "./serverFactory";

/** stderr専用の診断出力です。stdoutはMCPのJSON-RPC通信専用として汚染しません。 */
function reportDiagnostic(message: string) {
  process.stderr.write(`[engineering-notes-mcp] ${message}\n`);
}

/** stdio transportへ接続し、ローカルMCPクライアントからの要求を待ち受けます。 */
async function main() {
  const server = createEngineeringNotesMcpServer();
  const transport = new StdioServerTransport();
  let closing = false;

  /** SIGINT時の多重終了を防ぎ、MCP・Payload・DB poolを順番に閉じます。 */
  async function shutdown() {
    if (closing) {
      return;
    }

    closing = true;
    reportDiagnostic("終了処理を開始します。");
    await server.close();
    await closeMcpPayload();
  }

  process.once("SIGINT", () => {
    void shutdown().finally(() => process.exit(0));
  });

  await server.connect(transport);
  reportDiagnostic("stdio transportへ接続しました。");
}

main().catch((error: unknown) => {
  // 詳細はローカルのstderrだけへ出し、MCP Tool応答には安全なエラーだけを返します。
  process.stderr.write(
    `[engineering-notes-mcp] 起動に失敗しました: ${String(error)}\n`,
  );
  process.exitCode = 1;
});
