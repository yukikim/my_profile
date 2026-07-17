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
  const server = new McpServer({
    name: "my-profile-engineering-notes",
    version: "0.1.0",
  });

  registerEngineeringNotesTools(server, dataSource);
  return server;
}
