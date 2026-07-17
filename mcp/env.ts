import nextEnv from "@next/env";
import path from "node:path";
import { fileURLToPath } from "node:url";

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

/**
 * MCPはNext.jsとは別のNode.jsプロセスで動くため、明示的に.env系ファイルを読み込みます。
 * この順序をPayload設定のimportより先に保つことが、DB接続情報を正しく渡すうえで重要です。
 */
export function loadMcpEnvironment() {
  const projectRoot = path.resolve(dirname, "..");
  nextEnv.loadEnvConfig(projectRoot);

  return projectRoot;
}
