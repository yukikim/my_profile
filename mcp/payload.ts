import { getPayload, type Payload } from "payload";
import { loadMcpEnvironment } from "./env";

/** 同一MCPプロセス内でPayload接続を再利用するPromiseです。Toolごとの接続増加を防ぎます。 */
let payloadPromise: Promise<Payload> | undefined;

/** .env読込後にPayload設定を遅延importし、初期化済みのLocal APIを返します。 */
export function getMcpPayload() {
  if (!payloadPromise) {
    loadMcpEnvironment();
    // payload.config.tsが通常ログをstderrへ向けられるよう、設定import前にMCP起動を示します。
    process.env.MCP_STDIO_TRANSPORT = "1";
    payloadPromise = import("../payload.config").then(({ default: config }) =>
      getPayload({ config }),
    );
  }

  return payloadPromise;
}

/** PayloadとPostgreSQL poolを閉じ、stdioプロセスが接続待ちで残ることを防ぎます。 */
export async function closeMcpPayload() {
  if (!payloadPromise) {
    return;
  }

  const payload = await payloadPromise;
  await payload.destroy();

  const database = payload.db as Payload["db"] & {
    pool?: { end?: () => Promise<void> };
  };

  if (database.pool?.end) {
    await database.pool.end();
  }

  payloadPromise = undefined;
}
