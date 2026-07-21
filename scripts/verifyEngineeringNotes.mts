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

main().then(
  () => {
    // Payload内部の補助handleが残っても、全assertionと終了処理の完了後なら検証CLIを正常終了できます。
    process.exit(0);
  },
  (error: unknown) => {
    console.error(error);
    process.exit(1);
  },
);

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
    // Query Serviceの追加条件を使わず、Collection accessだけでも非公開記録が除外されるか確認します。
    const anonymousApiLogs = await payload.find({
      collection: "development-logs",
      depth: 0,
      draft: false,
      limit: 50,
      overrideAccess: false,
    });
    const anonymousApiDecisions = await payload.find({
      collection: "architecture-decisions",
      depth: 0,
      draft: false,
      limit: 50,
      overrideAccess: false,
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
    assert.ok(
      anonymousApiLogs.docs.every(
        (log) => log.status === "published" && log.visibility === "public",
      ),
    );
    assert.ok(
      anonymousApiLogs.docs.every(
        (log) => log.slug !== "investigate-works-fallback",
      ),
    );
    assert.ok(
      anonymousApiDecisions.docs.every(
        (decision) =>
          decision.status === "published" && decision.visibility === "public",
      ),
    );
    assert.ok(
      anonymousApiDecisions.docs.every(
        (decision) => decision.slug !== "initially-consider-mongodb",
      ),
    );

    payload.logger.info(
      `Engineering Notes verified: public logs=${publicLogs.length}, trusted logs=${trustedLogs.length}, public decisions=${publicDecisions.length}, trusted decisions=${trustedDecisions.length}, anonymous API logs=${anonymousApiLogs.totalDocs}, anonymous API decisions=${anonymousApiDecisions.totalDocs}`,
    );
  } finally {
    await closePayload(payload);
  }
}

/** Payloadの内部状態を破棄します。CLI固有の残存handleはmain完了後にプロセス側で終了します。 */
async function closePayload(payload: Payload) {
  await payload.destroy();
}
