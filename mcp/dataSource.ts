import type { Payload } from "payload";
import {
  queryArchitectureDecisions,
  queryDevelopmentLogs,
} from "../lib/engineering-notes/queries";
import type {
  ArchitectureDecisionQuery,
  ArchitectureDecisionResult,
  DevelopmentLogQuery,
  DevelopmentLogResult,
} from "../lib/engineering-notes/types";
import { getMcpPayload } from "./payload";

/** MCP側でaudienceを書き換えられないよう、呼び出し元からaudienceだけを除いた入力型です。 */
type TrustedDevelopmentLogQuery = Omit<DevelopmentLogQuery, "audience">;
type TrustedArchitectureDecisionQuery = Omit<
  ArchitectureDecisionQuery,
  "audience"
>;

/**
 * Toolが必要とする読み取り操作の境界です。
 * Payload依存を隔離することで、MCPプロトコルのテストでは安全なfakeへ差し替えられます。
 */
export type EngineeringNotesDataSource = {
  searchArchitectureDecisions: (
    input: TrustedArchitectureDecisionQuery,
  ) => Promise<ArchitectureDecisionResult[]>;
  searchDevelopmentLogs: (
    input: TrustedDevelopmentLogQuery,
  ) => Promise<DevelopmentLogResult[]>;
};

/** trusted-mcpをサーバー側で固定し、公開済みprivate記録の読取を許可するData Sourceです。 */
export function createPayloadDataSource(
  getPayloadInstance: () => Promise<Payload> = getMcpPayload,
): EngineeringNotesDataSource {
  return {
    async searchArchitectureDecisions(input) {
      const payload = await getPayloadInstance();
      return queryArchitectureDecisions(payload, {
        ...input,
        audience: "trusted-mcp",
      });
    },
    async searchDevelopmentLogs(input) {
      const payload = await getPayloadInstance();
      return queryDevelopmentLogs(payload, {
        ...input,
        audience: "trusted-mcp",
      });
    },
  };
}
