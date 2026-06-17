import { postgresAdapter } from "@payloadcms/db-postgres";
import { lexicalEditor } from "@payloadcms/richtext-lexical";
import path from "path";
import { buildConfig } from "payload";
import sharp from "sharp";
import { fileURLToPath } from "url";
import { Categories } from "@/collections/Categories";
import { Forms } from "@/collections/Forms";
import { FormSubmissions } from "@/collections/FormSubmissions";
import { Media } from "@/collections/Media";
import { Pages } from "@/collections/Pages";
import { Posts } from "@/collections/Posts";
import { Users } from "@/collections/Users";
import { Works } from "@/collections/Works";
import { Footer } from "@/globals/Footer";
import { Header } from "@/globals/Header";
import { Profile } from "@/globals/Profile";
import { SiteSettings } from "@/globals/SiteSettings";
import { en } from '@payloadcms/translations/languages/en'
import { ja } from '@payloadcms/translations/languages/ja'

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

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
  ],
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URI || "",
    },
  }),
  editor: lexicalEditor({}),
  globals: [Profile, SiteSettings, Header, Footer],
  secret: process.env.PAYLOAD_SECRET || "development-secret-change-me",
  sharp,
  typescript: {
    outputFile: path.resolve(dirname, "payload-types.ts"),
  },
  i18n: {
    supportedLanguages: { en, ja },
    fallbackLanguage: 'ja',
  },
});
