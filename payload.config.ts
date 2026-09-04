import { postgresAdapter } from "@payloadcms/db-postgres";
import { lexicalEditor } from "@payloadcms/richtext-lexical";
import { vercelBlobStorage } from "@payloadcms/storage-vercel-blob";
import path from "path";
import { buildConfig } from "payload";
import sharp from "sharp";
import { fileURLToPath } from "url";
import { ArchitectureDecisions } from "./collections/ArchitectureDecisions";
import { Categories } from "./collections/Categories";
import { DevelopmentLogs } from "./collections/DevelopmentLogs";
import { Forms } from "./collections/Forms";
import { FormSubmissions } from "./collections/FormSubmissions";
import { Media } from "./collections/Media";
import { Pages } from "./collections/Pages";
import { Posts } from "./collections/Posts";
import { Users } from "./collections/Users";
import { Works } from "./collections/Works";
import { Footer } from "./globals/Footer";
import { Header } from "./globals/Header";
import { Profile } from "./globals/Profile";
import { SiteSettings } from "./globals/SiteSettings";
import { en } from "@payloadcms/translations/languages/en";
import { ja } from "@payloadcms/translations/languages/ja";

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

// Vercelではローカルファイルへの保存や開発用secretでの起動を許可しません。
if (process.env.VERCEL === "1") {
  for (const name of [
    "DATABASE_URI",
    "PAYLOAD_SECRET",
    "BLOB_READ_WRITE_TOKEN",
  ]) {
    if (!process.env[name]?.trim()) {
      throw new Error(`${name} is required on Vercel.`);
    }
  }
  if (
    process.env.PAYLOAD_SECRET === "development-secret-change-me" ||
    process.env.PAYLOAD_SECRET === "replace-with-a-long-random-secret"
  ) {
    throw new Error("Set a unique PAYLOAD_SECRET on Vercel.");
  }
}

// import CLIではDB例外の詳細を安全な固定エラーへ変換するため、変換前のPayload内部ログを抑止します。
// stdio MCPではstdoutがJSON-RPC専用なので、Payloadの通常ログをstderrへ退避させます。
const payloadLogger =
  process.env.ENGINEERING_NOTE_IMPORT_CLI === "1"
    ? { options: { level: "silent" } }
    : process.env.MCP_STDIO_TRANSPORT === "1"
      ? { options: { level: "info" }, destination: process.stderr }
      : undefined;

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  collections: [
    Users,
    Media,
    Pages,
    Posts,
    Categories,
    Works,
    Forms,
    FormSubmissions,
    // Engineering Notesは相互relationshipを持つため、両方を同じPayload設定へ登録します。
    DevelopmentLogs,
    ArchitectureDecisions,
  ],
  db: postgresAdapter({
    migrationDir: path.resolve(dirname, "migrations"),
    // schema変更はmigrationだけで管理し、開発起動時の自動pushで履歴がずれるのを防ぎます。
    push: false,
    pool: {
      connectionString: process.env.DATABASE_URI || "",
      max: 5,
      connectionTimeoutMillis: 10_000,
    },
  }),
  editor: lexicalEditor({}),
  globals: [Profile, SiteSettings, Header, Footer],
  logger: payloadLogger,
  plugins: [
    async (config) => {
      const blobConfig = await vercelBlobStorage({
        collections: { media: true },
        token: process.env.BLOB_READ_WRITE_TOKEN,
        // prefixを追加せず既存schemaを維持し、サーバーで画像サイズを生成します。
        clientUploads: false,
      })(config);

      // 3.85.1はclientUploads:falseでもproviderを登録し、そのutilities importが
      // Node専用コードをclient bundleへ取り込みます。未使用providerだけ除外します。
      const clientHandler =
        "@payloadcms/storage-vercel-blob/client#VercelBlobClientUploadHandler";
      if (blobConfig.admin?.dependencies) {
        delete blobConfig.admin.dependencies[clientHandler];
      }
      if (blobConfig.admin?.components?.providers) {
        blobConfig.admin.components.providers =
          blobConfig.admin.components.providers.filter((provider) =>
            typeof provider === "string"
              ? provider !== clientHandler
              : !provider || provider.path !== clientHandler,
          );
      }
      return blobConfig;
    },
  ],
  secret: process.env.PAYLOAD_SECRET || "development-secret-change-me",
  sharp,
  typescript: {
    outputFile: path.resolve(dirname, "payload-types.ts"),
  },
  i18n: {
    supportedLanguages: { en, ja },
    fallbackLanguage: "ja",
  },
});
