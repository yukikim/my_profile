import { postgresAdapter } from "@payloadcms/db-postgres";
import { lexicalEditor } from "@payloadcms/richtext-lexical";
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

// stdio MCPではstdoutがJSON-RPC専用なので、Payloadの通常ログもstderrへ退避させます。
const payloadLogger =
  process.env.MCP_STDIO_TRANSPORT === "1"
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
    },
  }),
  editor: lexicalEditor({}),
  globals: [Profile, SiteSettings, Header, Footer],
  logger: payloadLogger,
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
