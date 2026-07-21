import nextEnv from "@next/env";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { getPayload } from "payload";
import {
  formatEngineeringNoteDryRunReport,
  formatEngineeringNoteImportError,
  runEngineeringNoteDraftDryRun,
} from "../lib/engineering-notes/drafts/importCli";

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);
const projectRoot = path.resolve(dirname, "..");

main().then((exitCode) => {
  process.exit(exitCode);
});

async function main() {
  try {
    const report = await runEngineeringNoteDraftDryRun({
      argv: process.argv.slice(2),
      cwd: process.cwd(),
      loadPayload: async () => {
        // standalone CLIでもNext.jsと同じ.envを使い、設定importは環境変数読込後まで遅延します。
        nextEnv.loadEnvConfig(projectRoot);
        // config import前に設定し、Payload内部のDB例外が安全化より先にstderrへ出るのを防ぎます。
        process.env.ENGINEERING_NOTE_IMPORT_CLI = "1";
        const { default: config } = await import("../payload.config");
        return getPayload({ config });
      },
    });
    console.info(formatEngineeringNoteDryRunReport(report));
    return 0;
  } catch (error) {
    // 生のErrorをconsoleへ渡さず、安全なcodeとfield pathだけをstderrへ表示します。
    console.error(formatEngineeringNoteImportError(error));
    return 1;
  }
}
