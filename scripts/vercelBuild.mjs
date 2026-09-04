import { spawnSync } from "node:child_process";

// Vercelの環境変数のみを使い、ローカルの.envを読み込んでDBを変更しません。
const required = [
  "DATABASE_URI",
  "DATABASE_URI_DIRECT",
  "PAYLOAD_SECRET",
  "BLOB_STORE_ID",
  "NEXT_PUBLIC_SITE_URL",
];
for (const name of required) {
  if (!process.env[name]?.trim()) {
    throw new Error(`${name} is required for build:vercel.`);
  }
}
if (process.env.VERCEL !== "1") {
  throw new Error(
    "build:vercel must run in Vercel. Use npm run build locally.",
  );
}

// 誤って別のDBへmigrationを適用しないよう、pooled/directの接続先を照合します。
function databaseIdentity(name) {
  let url;
  try {
    url = new URL(process.env[name]);
  } catch {
    throw new Error(`${name} must be a PostgreSQL URL.`);
  }
  if (
    !["postgres:", "postgresql:"].includes(url.protocol) ||
    !url.hostname ||
    !url.pathname.replace(/^\//, "")
  ) {
    throw new Error(`${name} must include a PostgreSQL host and database.`);
  }
  if (name === "DATABASE_URI_DIRECT" && url.hostname.includes("-pooler.")) {
    throw new Error("DATABASE_URI_DIRECT must use a non-pooled connection.");
  }
  return [
    url.hostname.replace("-pooler.", "."),
    url.port || "5432",
    url.pathname,
    url.username,
  ].join("|");
}
if (
  databaseIdentity("DATABASE_URI") !== databaseIdentity("DATABASE_URI_DIRECT")
) {
  throw new Error(
    "DATABASE_URI and DATABASE_URI_DIRECT must point to the same database and role.",
  );
}
const siteURL = new URL(process.env.NEXT_PUBLIC_SITE_URL);
if (siteURL.protocol !== "https:") {
  throw new Error("NEXT_PUBLIC_SITE_URL must use HTTPS on Vercel.");
}

function run(script, env = process.env) {
  const result = spawnSync("npm", ["run", script], { env, stdio: "inherit" });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}

// Git連携はGitHub Actionsの完了を自動では待たないため、ここでも検証します。
run("check");
run("migrate", {
  ...process.env,
  DATABASE_URI: process.env.DATABASE_URI_DIRECT,
});
run("build");
