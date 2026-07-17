import assert from "node:assert/strict";
import nextEnv from "@next/env";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { getPayload, type Payload } from "payload";
import {
  queryArchitectureDecisions,
  queryDevelopmentLogs,
} from "../lib/engineering-notes/queries";

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);
const projectRoot = path.resolve(dirname, "..");

// standalone Node.jsでもNext.jsと同じ環境変数を利用できるよう、プロジェクトrootから読み込みます。
nextEnv.loadEnvConfig(projectRoot);

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});

/**
 * 実DBに対してpublic-siteとtrusted-mcpの境界を検証します。
 * 単体テストだけでは検出できないPayloadのfield pathやrelationship検索も確認します。
 */
async function main() {
  // ESMの静的importより先に.envを読み込むため、Payload設定はここで遅延importします。
  const { default: config } = await import("../payload.config");
  const payload = await getPayload({ config });

  try {
    const publicLogs = await queryDevelopmentLogs(payload, {
      audience: "public-site",
      // public-siteはこの指定を信用せず、publicへ固定される必要があります。
      visibility: "private",
    });
    const trustedLogs = await queryDevelopmentLogs(payload, {
      audience: "trusted-mcp",
      visibility: "all",
    });
    const taggedLogs = await queryDevelopmentLogs(payload, {
      audience: "trusted-mcp",
      relatedWorkSlug: "starter-showcase",
      tags: ["fallback"],
      visibility: "all",
    });
    const emptyLogs = await queryDevelopmentLogs(payload, {
      audience: "trusted-mcp",
      query: "__engineering_notes_no_match__",
      visibility: "all",
    });
    const publicDecisions = await queryArchitectureDecisions(payload, {
      audience: "public-site",
      visibility: "private",
    });
    const trustedDecisions = await queryArchitectureDecisions(payload, {
      audience: "trusted-mcp",
      visibility: "all",
    });

    assert.ok(publicLogs.length >= 1);
    assert.ok(publicLogs.every((log) => log.visibility === "public"));
    assert.ok(
      trustedLogs.some((log) => log.slug === "investigate-works-fallback"),
    );
    assert.ok(
      trustedLogs.every((log) => log.slug !== "plan-engineering-notes-pages"),
    );
    assert.deepEqual(
      taggedLogs.map((log) => log.slug),
      ["investigate-works-fallback"],
    );
    assert.ok(taggedLogs[0]?.relatedWorks.length);
    assert.deepEqual(emptyLogs, []);

    assert.ok(publicDecisions.length >= 1);
    assert.ok(
      publicDecisions.every((decision) => decision.visibility === "public"),
    );
    assert.ok(
      trustedDecisions.some(
        (decision) => decision.slug === "initially-consider-mongodb",
      ),
    );
    assert.ok(
      trustedDecisions.every(
        (decision) => decision.slug !== "remote-mcp-authorization",
      ),
    );

    payload.logger.info(
      `Engineering Notes verified: public logs=${publicLogs.length}, trusted logs=${trustedLogs.length}, public decisions=${publicDecisions.length}, trusted decisions=${trustedDecisions.length}`,
    );
  } finally {
    await closePayload(payload);
  }
}

/** PayloadとPostgreSQL poolを閉じ、検証コマンドが接続待ちで終了しない状態を防ぎます。 */
async function closePayload(payload: Payload) {
  await payload.destroy();

  const database = payload.db as Payload["db"] & {
    pool?: { end?: () => Promise<void> };
  };

  if (database.pool?.end) {
    await database.pool.end();
  }
}
