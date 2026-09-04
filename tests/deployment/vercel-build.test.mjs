import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import test from "node:test";

const script = new URL("../../scripts/vercelBuild.mjs", import.meta.url);
const env = {
  VERCEL: "1",
  DATABASE_URI: "postgresql://ci:private-value@ep-ci-pooler.example/db",
  DATABASE_URI_DIRECT: "postgresql://ci:private-value@ep-ci.example/db",
  PAYLOAD_SECRET: "test-only",
  BLOB_READ_WRITE_TOKEN: "test-only",
  NEXT_PUBLIC_SITE_URL: "https://example.com",
};

// すべてnpm/migrationの起動前に拒否される入力。実DBへは接続しません。
for (const [name, overrides, message] of [
  [
    "missing direct URL",
    { DATABASE_URI_DIRECT: "" },
    "DATABASE_URI_DIRECT is required",
  ],
  [
    "different database",
    {
      DATABASE_URI_DIRECT: "postgresql://ci:private-value@ep-other.example/db",
    },
    "must point to the same database",
  ],
  [
    "pooled migration URL",
    { DATABASE_URI_DIRECT: env.DATABASE_URI },
    "must use a non-pooled connection",
  ],
  [
    "missing database name",
    { DATABASE_URI_DIRECT: "postgresql://ci:private-value@ep-ci.example" },
    "must include a PostgreSQL host and database",
  ],
  ["non-Vercel invocation", { VERCEL: "" }, "must run in Vercel"],
  [
    "insecure site URL",
    { NEXT_PUBLIC_SITE_URL: "http://example.com" },
    "must use HTTPS",
  ],
]) {
  test(`build refuses ${name} before running migrations`, () => {
    const result = spawnSync(process.execPath, [script.pathname], {
      env: { ...env, ...overrides },
      encoding: "utf8",
      timeout: 5_000,
    });
    assert.equal(result.status, 1);
    assert.ok(result.stderr.includes(message), result.stderr);
    assert.ok(!result.stderr.includes("private-value"));
    assert.equal(result.stdout, "");
  });
}
