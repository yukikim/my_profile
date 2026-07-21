import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import {
  createPayloadDataSource,
  type EngineeringNotesDataSource,
} from "./dataSource";
import { registerEngineeringNotesTools } from "./registerTools";

/**
 * MCPサーバーを生成するfactoryです。
 * Data Sourceを引数にすることで、本番はPayload、テストは固定データを同じTool定義へ接続できます。
 */
export function createEngineeringNotesMcpServer(
  dataSource: EngineeringNotesDataSource = createPayloadDataSource(),
) {
  const server = new McpServer(
    {
      name: "my-profile-engineering-notes",
      version: "0.1.0",
    },
    {
      // CodexがTool選択前に理解すべき信頼境界を、server-wide instructionsで伝えます。
      instructions:
        "my_profileの公開済み開発日誌と設計判断を検索する読み取り専用サーバーです。回答では根拠になった日誌slugまたはADR decisionIdを示してください。private記録はローカルの信頼済みCodexだけで扱い、draftは返しません。",
    },
  );

  registerEngineeringNotesTools(server, dataSource);
  return server;
}
