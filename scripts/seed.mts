import { postgresAdapter } from "@payloadcms/db-postgres";
import { lexicalEditor } from "@payloadcms/richtext-lexical";
import nextEnv from "@next/env";
import path from "path";
import { buildConfig } from "payload";
import { getPayload, type Payload } from "payload";
import sharp from "sharp";
import { fileURLToPath } from "url";
import { ArchitectureDecisions } from "@/collections/ArchitectureDecisions";
import { Categories } from "@/collections/Categories";
import { DevelopmentLogs } from "@/collections/DevelopmentLogs";
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
import {
  siteTemplates,
  type SiteTemplateKey,
} from "@/lib/templates/siteTemplates";
import type { PageBlock } from "@/lib/content";
import type {
  ArchitectureDecision,
  Category,
  DevelopmentLog,
  Form,
  Page,
  Post as PayloadPost,
  Profile as PayloadProfile,
  Work as PayloadWork,
} from "../payload-types";

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);
const projectRoot = path.resolve(dirname, "..");
nextEnv.loadEnvConfig(projectRoot);

type SeedCollection =
  | "architecture-decisions"
  | "categories"
  | "development-logs"
  | "pages"
  | "posts"
  | "works";
type SeedDataByCollection = {
  "architecture-decisions": Pick<
    ArchitectureDecision,
    | "context"
    | "decidedAt"
    | "decision"
    | "decisionId"
    | "decisionStatus"
    | "negativeConsequences"
    | "options"
    | "positiveConsequences"
    | "project"
    | "publishedAt"
    | "rationale"
    | "relatedLogs"
    | "relatedWorks"
    | "slug"
    | "status"
    | "supersedes"
    | "tags"
    | "title"
    | "visibility"
  >;
  categories: Pick<Category, "description" | "name" | "slug" | "type">;
  "development-logs": Pick<
    DevelopmentLog,
    | "cause"
    | "implementation"
    | "lessonsLearned"
    | "logDate"
    | "nextActions"
    | "problem"
    | "project"
    | "publishedAt"
    | "relatedDecisions"
    | "relatedWorks"
    | "resolution"
    | "slug"
    | "status"
    | "summary"
    | "tags"
    | "title"
    | "visibility"
  >;
  pages: Pick<Page, "layout" | "publishedAt" | "slug" | "status" | "title">;
  posts: Pick<
    PayloadPost,
    | "categories"
    | "content"
    | "excerpt"
    | "publishedAt"
    | "slug"
    | "status"
    | "title"
  >;
  works: Pick<
    PayloadWork,
    | "categories"
    | "content"
    | "endDate"
    | "excerpt"
    | "featured"
    | "publishedAt"
    | "role"
    | "slug"
    | "startDate"
    | "status"
    | "techStack"
    | "title"
  >;
};
type SeedDocumentByCollection = {
  "architecture-decisions": ArchitectureDecision;
  categories: Category;
  "development-logs": DevelopmentLog;
  pages: Page;
  posts: PayloadPost;
  works: PayloadWork;
};
type RichTextDocument = PayloadProfile["bio"];
type PageLayoutBlock = NonNullable<Page["layout"]>[number];

/**
 * version対応Collectionをseedするときの保存方法を指定します。
 * `draft: true` はPayloadの公開版を上書きせず、確認用の下書きとして保存します。
 */
type SeedWriteOptions = {
  draft?: boolean;
};

// Payloadのdraft機能を持つCollectionでは、独自statusに加えて内部`_status`も同期します。
const versionedSeedCollections = new Set<SeedCollection>([
  "architecture-decisions",
  "development-logs",
  "pages",
  "posts",
  "works",
]);

const templateKey = getTemplateKey();
const template = siteTemplates[templateKey];

main()
  .then(() => {
    process.exit(0);
  })
  .catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  });

/**
 * seed全体の実行順を管理します。
 * Engineering Notesは既存Workとのrelationshipを持つため、Worksを先に作成します。
 */
async function main() {
  const databaseUri = getRequiredEnv("DATABASE_URI");

  const config = await buildConfig({
    admin: {
      importMap: {
        autoGenerate: false,
        baseDir: projectRoot,
      },
      user: Users.slug,
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
      DevelopmentLogs,
      ArchitectureDecisions,
    ],
    db: postgresAdapter({
      migrationDir: path.resolve(projectRoot, "migrations"),
      // seed実行時もschemaを自動変更せず、適用済みmigrationをDB構造の正本にします。
      push: false,
      pool: {
        connectionString: databaseUri,
      },
    }),
    editor: lexicalEditor({}),
    globals: [Profile, SiteSettings, Header, Footer],
    secret: process.env.PAYLOAD_SECRET || "development-secret-change-me",
    sharp,
    typescript: {
      autoGenerate: false,
      outputFile: path.resolve(projectRoot, "payload-types.ts"),
    },
  });
  const payload = await getPayload({ config });

  try {
    await seedAdminUser(payload);
    const categories = await seedCategories(payload);
    const contactForm = await seedContactForm(payload);

    await seedGlobals(payload);
    await seedPages(payload, contactForm.id);
    await seedPosts(payload, categories);
    const showcaseWork = await seedWorks(payload, categories);
    await seedEngineeringNotes(payload, showcaseWork.id);

    payload.logger.info(`Seed completed with template: ${template.label}`);
  } finally {
    await payload.destroy();
    void closePayloadConnections(payload);
  }
}

async function closePayloadConnections(payload: Payload) {
  const database = payload.db as Payload["db"] & {
    pool?: { end?: () => Promise<void> };
  };

  if (database.pool?.end) {
    await database.pool.end();
  }
}

function getRequiredEnv(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`${name} is required. Set it in .env before running seed.`);
  }

  return value;
}

function getTemplateKey(): SiteTemplateKey {
  const value = process.env.TEMPLATE || "profile";

  if (value in siteTemplates) {
    return value as SiteTemplateKey;
  }

  throw new Error(
    `Unknown TEMPLATE "${value}". Use one of: ${Object.keys(siteTemplates).join(", ")}`,
  );
}

async function seedAdminUser(payload: Payload) {
  const email = process.env.SEED_ADMIN_EMAIL || "admin@example.com";
  const existing = await payload.find({
    collection: "users",
    limit: 1,
    where: {
      email: {
        equals: email,
      },
    },
  });

  if (existing.docs[0]) {
    return existing.docs[0];
  }

  return payload.create({
    collection: "users",
    data: {
      email,
      name: process.env.SEED_ADMIN_NAME || "Admin User",
      password: process.env.SEED_ADMIN_PASSWORD || "password123",
      role: "admin",
    },
  });
}

async function seedCategories(payload: Payload) {
  const result: Record<string, number> = {};

  for (const category of template.categories) {
    const doc = await upsertBySlug(
      payload,
      "categories",
      category.slug,
      category,
    );

    result[category.slug] = doc.id;
  }

  return result;
}

async function seedContactForm(payload: Payload): Promise<Form> {
  const existing = await payload.find({
    collection: "forms",
    limit: 1,
    where: {
      name: {
        equals: "Contact",
      },
    },
  });
  const fields = [
    { label: "お名前", name: "name", required: true, type: "text" },
    { label: "メールアドレス", name: "email", required: true, type: "email" },
    { label: "件名", name: "subject", required: true, type: "text" },
    { label: "本文", name: "message", required: true, type: "textarea" },
  ] satisfies Form["fields"];
  const data = {
    fields,
    name: "Contact",
    successMessage:
      "お問い合わせありがとうございます。内容を確認して返信します。",
  } satisfies Pick<Form, "fields" | "name" | "successMessage">;

  if (existing.docs[0]) {
    const updated = await payload.update({
      collection: "forms",
      id: existing.docs[0].id,
      data,
    });

    if ("docs" in updated) {
      return existing.docs[0];
    }

    return updated;
  }

  return payload.create({
    collection: "forms",
    data,
  });
}

async function seedGlobals(payload: Payload) {
  await payload.updateGlobal({
    slug: "site-settings",
    data: {
      siteDescription: template.siteDescription,
      siteName: template.siteName,
      siteUrl: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
    },
  });
  await payload.updateGlobal({
    slug: "header",
    data: {
      ctaButton: {
        href: "/contact",
        label: "Contact",
      },
      navigation: template.navigation,
    },
  });
  await payload.updateGlobal({
    slug: "footer",
    data: {
      copyright: `© ${new Date().getFullYear()} ${template.siteName}`,
      navigation: template.navigation,
      snsLinks: [
        { label: "GitHub", url: "https://github.com/" },
        { label: "LinkedIn", url: "https://www.linkedin.com/" },
      ],
    },
  });
  await payload.updateGlobal({
    slug: "profile",
    data: {
      bio: richText(
        "CMSテンプレートをベースに、プロフィール、企業サイト、LP、ブログへ展開できます。",
      ),
      careers: [
        {
          description:
            "Payload CMS と Next.js を使ったサイトテンプレートを整備。",
          period: "Now",
          title: template.label,
        },
      ],
      name: template.siteName,
      skills: [
        { skill: "Next.js" },
        { skill: "Payload CMS" },
        { skill: "PostgreSQL" },
        { skill: "Block Editor" },
      ],
      snsLinks: [
        { label: "GitHub", url: "https://github.com/" },
        { label: "LinkedIn", url: "https://www.linkedin.com/" },
      ],
      title: template.label,
    },
  });
}

async function seedPages(payload: Payload, contactFormId: Form["id"]) {
  for (const page of template.pages) {
    await upsertBySlug(payload, "pages", page.slug, {
      layout: page.layout.map((block) => toPayloadBlock(block, contactFormId)),
      publishedAt: page.publishedAt,
      slug: page.slug,
      status: page.status,
      title: page.title,
    });
  }
}

async function seedPosts(payload: Payload, categories: Record<string, number>) {
  const categoryId = firstCategoryId(categories);

  await upsertBySlug(payload, "posts", "welcome-to-cms-template", {
    categories: categoryId ? [categoryId] : undefined,
    content: richText(
      `${template.label}として使い始めるための初期記事です。カテゴリやSEOを調整して公開できます。`,
    ),
    excerpt: "テンプレート初期記事。CMSから編集できます。",
    publishedAt: new Date().toISOString(),
    slug: "welcome-to-cms-template",
    status: "published",
    title: "CMSテンプレートを使い始める",
  });
}

/**
 * Engineering Notesから参照するサンプルWorkを返します。
 * 呼び出し側が返却IDをrelationshipへ設定することで、文字列ではなくDB上の関連を作れます。
 */
async function seedWorks(payload: Payload, categories: Record<string, number>) {
  const categoryId = firstCategoryId(categories);

  return upsertBySlug(payload, "works", "starter-showcase", {
    categories: categoryId ? [categoryId] : undefined,
    content: richText(
      "制作実績や導入事例のサンプルです。担当範囲、使用技術、関連リンクを編集できます。",
    ),
    excerpt: "テンプレート初期実績。CMSから編集できます。",
    featured: true,
    publishedAt: new Date().toISOString(),
    role: "Template setup",
    slug: "starter-showcase",
    startDate: new Date().toISOString(),
    endDate: new Date().toISOString(),
    status: "published",
    techStack: [
      { technology: "Next.js" },
      { technology: "Payload CMS" },
      { technology: "PostgreSQL" },
    ],
    title: "スターター実績",
  });
}

/**
 * ADRと開発日誌の代表データを作成します。
 * public/privateとdraft/publishedの全組み合わせを用意し、後続Phaseで
 * アクセス制御やMCP検索を実データに対して検証できるようにします。
 */
async function seedEngineeringNotes(payload: Payload, relatedWorkId: number) {
  const now = new Date().toISOString();

  // 置き換え元を先に作ることで、後から作るPostgreSQLのADRがsupersedesで参照できます。
  const mongoDecision = await upsertBySlug(
    payload,
    "architecture-decisions",
    "initially-consider-mongodb",
    {
      context:
        "Payload CMSのデータベース候補としてMongoDBを含めて検討していた。",
      decidedAt: now,
      decision:
        "MongoDB案は採用せず、後続のPostgreSQL採用ADRによって置き換える。",
      decisionId: "ADR-0001",
      decisionStatus: "superseded",
      negativeConsequences: [
        { item: "既存のPostgreSQL運用知識をそのまま利用しにくい。" },
      ],
      options: [
        {
          cons: [{ item: "本プロジェクトでは別のDB運用知識が必要になる。" }],
          description: "ドキュメント指向DBとしてPayloadのデータを保存する。",
          name: "MongoDB",
          pros: [{ item: "柔軟なドキュメント構造を扱いやすい。" }],
        },
      ],
      positiveConsequences: [
        { item: "検討履歴を削除せず、判断の変化を追跡できる。" },
      ],
      project: "my_profile",
      publishedAt: now,
      rationale:
        "最終判断との比較材料として残しつつ、公開サイトには出さないため。",
      relatedLogs: [],
      relatedWorks: [relatedWorkId],
      slug: "initially-consider-mongodb",
      status: "published",
      supersedes: undefined,
      tags: [{ label: "database" }, { label: "mongodb" }],
      title: "初期案としてMongoDBを検討した",
      visibility: "private",
    },
  );

  const postgresDecision = await upsertBySlug(
    payload,
    "architecture-decisions",
    "choose-postgresql",
    {
      context:
        "プロフィールサイトのCMSデータを、運用経験がありSQLでも確認できるDBへ保存したい。",
      decidedAt: now,
      decision: "Payload CMSのDBとしてPostgreSQLを採用する。",
      decisionId: "ADR-0002",
      decisionStatus: "accepted",
      negativeConsequences: [
        { item: "ローカル開発ではPostgreSQLコンテナの起動が必要になる。" },
      ],
      options: [
        {
          cons: [{ item: "スキーマ変更時にmigration管理が必要になる。" }],
          description: "PayloadのPostgreSQL adapterを使用する。",
          name: "PostgreSQL",
          pros: [
            { item: "既存のSQLとPostgreSQL運用知識を再利用できる。" },
            { item: "Neonなどのホスティング候補を利用できる。" },
          ],
        },
        {
          cons: [{ item: "このプロジェクトでは新しい運用知識が増える。" }],
          description: "ドキュメント指向DBを使用する。",
          name: "MongoDB",
          pros: [{ item: "柔軟なデータ構造を扱いやすい。" }],
        },
      ],
      positiveConsequences: [
        { item: "Dockerと本番DBで同じPostgreSQLを利用できる。" },
      ],
      project: "my_profile",
      publishedAt: now,
      rationale:
        "既存知識、Payload公式adapter、本番候補との整合性を優先したため。",
      relatedLogs: [],
      relatedWorks: [relatedWorkId],
      slug: "choose-postgresql",
      status: "published",
      supersedes: mongoDecision.id,
      tags: [{ label: "database" }, { label: "postgresql" }],
      title: "データベースにPostgreSQLを採用する",
      visibility: "public",
    },
  );

  await upsertBySlug(
    payload,
    "architecture-decisions",
    "use-stdio-for-local-mcp",
    {
      context:
        "最初のMCPはローカルのCodexからだけ利用し、外部公開を必要としない。",
      decidedAt: undefined,
      decision: "初期MCP transportにはstdioを使用する。",
      decisionId: "ADR-0003",
      decisionStatus: "proposed",
      negativeConsequences: [
        { item: "外部ホスト上のMCPクライアントから直接接続できない。" },
      ],
      options: [
        {
          cons: [{ item: "ローカルプロセスとして実行する必要がある。" }],
          description: "MCPクライアントの子プロセスとして起動する。",
          name: "stdio",
          pros: [{ item: "HTTP公開とOAuth認証がMVPでは不要になる。" }],
        },
        {
          cons: [{ item: "認証、HTTPS、公開運用の設計が必要になる。" }],
          description: "ネットワーク経由でMCPを公開する。",
          name: "Streamable HTTP",
          pros: [{ item: "リモートクライアントから利用できる。" }],
        },
      ],
      positiveConsequences: [{ item: "読み取り専用MCPの学習に範囲を絞れる。" }],
      project: "my_profile",
      publishedAt: undefined,
      rationale:
        "個人利用のMVPでは、ネットワーク公開より実装と検索設計の学習を優先するため。",
      relatedLogs: [],
      relatedWorks: [relatedWorkId],
      slug: "use-stdio-for-local-mcp",
      status: "draft",
      supersedes: undefined,
      tags: [{ label: "mcp" }, { label: "stdio" }],
      title: "ローカルMCPにstdioを使用する",
      visibility: "public",
    },
    { draft: true },
  );

  await upsertBySlug(
    payload,
    "architecture-decisions",
    "remote-mcp-authorization",
    {
      context:
        "将来MCPをリモート公開する場合は、privateな開発記録を保護する認可が必要になる。",
      decidedAt: undefined,
      decision: "リモート化の要件が確定するまで認可方式の最終決定を保留する。",
      decisionId: "ADR-0004",
      decisionStatus: "proposed",
      negativeConsequences: [{ item: "リモートMCPはMVPに含められない。" }],
      options: [
        {
          cons: [{ item: "認可サーバーを含む追加実装が必要になる。" }],
          description: "HTTP transport向けの標準的な認可フローを採用する。",
          name: "OAuth 2.1",
          pros: [{ item: "利用者とscopeを明示的に管理できる。" }],
        },
      ],
      positiveConsequences: [
        { item: "不完全な固定APIキー方式を先に作らずに済む。" },
      ],
      project: "my_profile",
      publishedAt: undefined,
      rationale: "認証要件とデプロイ先を先に確定する必要があるため。",
      relatedLogs: [],
      relatedWorks: [relatedWorkId],
      slug: "remote-mcp-authorization",
      status: "draft",
      supersedes: undefined,
      tags: [{ label: "mcp" }, { label: "security" }],
      title: "リモートMCPの認可方式を検討する",
      visibility: "private",
    },
    { draft: true },
  );

  const developmentLogs = [
    {
      data: {
        cause:
          "フォーム定義と送信データを同じ責務で扱うと、再利用可能なフォーム構成と個別送信履歴が密結合になる。",
        implementation:
          "Formsで入力項目を定義し、FormSubmissionsへ実際の送信値を保存する構成を実装した。",
        lessonsLearned:
          "再利用する定義データと、増え続けるイベントデータは別Collectionにすると責務が明確になる。",
        logDate: now,
        nextActions: [{ task: "公開画面からの送信フローを継続的に確認する。" }],
        problem:
          "問い合わせフォームの定義と送信結果をどの単位で保存するか決める必要があった。",
        project: "my_profile",
        publishedAt: now,
        relatedDecisions: [],
        relatedWorks: [relatedWorkId],
        resolution:
          "FormsとFormSubmissionsを分離し、送信時は対象Formをrelationshipで参照するようにした。",
        slug: "implement-contact-form-storage",
        status: "published" as const,
        summary: "問い合わせフォームの定義と送信データ保存を実装した。",
        tags: [{ label: "payload" }, { label: "forms" }],
        title: "問い合わせフォームの保存構成を実装",
        visibility: "public" as const,
      },
      draft: false,
    },
    {
      data: {
        cause:
          "ローカルDBやPayloadを利用できない場合でも、公開サイトの実績表示を維持する設計になっているため。",
        implementation:
          "getWorksとgetWorkのPayload取得失敗時に、lib/content.tsの静的データへ切り替わる経路を確認した。",
        lessonsLearned:
          "可用性を高めるfallbackは有効だが、CMS障害を見逃さないログ設計も必要になる。",
        logDate: now,
        nextActions: [{ task: "fallback発生を検知できる運用方法を検討する。" }],
        problem:
          "DBにあるはずの実績ではなく静的な実績が表示される条件を特定する必要があった。",
        project: "my_profile",
        publishedAt: now,
        relatedDecisions: [],
        relatedWorks: [relatedWorkId],
        resolution:
          "Payload client、取得helper、静的データの順に呼び出し経路を追跡し、fallback条件を整理した。",
        slug: "investigate-works-fallback",
        status: "published" as const,
        summary: "Works取得処理の静的データfallback条件を調査した。",
        tags: [{ label: "payload" }, { label: "fallback" }],
        title: "Worksのfallback経路を調査",
        visibility: "private" as const,
      },
      draft: false,
    },
    {
      data: {
        cause: undefined,
        implementation:
          "一覧、開発日誌詳細、ADR詳細のURLと表示項目を設計した。",
        lessonsLearned:
          "公開画面を作る前にpublic-site向けの共通検索条件を完成させる必要がある。",
        logDate: now,
        nextActions: [{ task: "Phase 3のQuery Serviceを先に実装する。" }],
        problem: "privateやdraftを画面へ漏らさない取得境界が必要になる。",
        project: "my_profile",
        publishedAt: undefined,
        relatedDecisions: [],
        relatedWorks: [relatedWorkId],
        resolution: undefined,
        slug: "plan-engineering-notes-pages",
        status: "draft" as const,
        summary: "Engineering Notes公開画面の構成を検討した。",
        tags: [{ label: "nextjs" }, { label: "engineering-notes" }],
        title: "Engineering Notes画面を設計",
        visibility: "public" as const,
      },
      draft: true,
    },
    {
      data: {
        cause: undefined,
        implementation:
          "環境変数、エラーログ、MCP応答へ含めてはいけない情報を整理した。",
        lessonsLearned:
          "private指定だけに頼らず、MCPのResponse Mapperでもallowlistが必要になる。",
        logDate: now,
        nextActions: [{ task: "Phase 3でallowlist方式のMapperを実装する。" }],
        problem:
          "MCPプロセスはDBへ直接接続できるため、返却フィールドを明示的に制限する必要がある。",
        project: "my_profile",
        publishedAt: undefined,
        relatedDecisions: [postgresDecision.id],
        relatedWorks: [relatedWorkId],
        resolution: undefined,
        slug: "define-mcp-sensitive-data-boundary",
        status: "draft" as const,
        summary: "MCPが扱う機密情報の境界を整理した。",
        tags: [{ label: "mcp" }, { label: "security" }],
        title: "MCPの機密情報境界を整理",
        visibility: "private" as const,
      },
      draft: true,
    },
  ] satisfies Array<{
    data: SeedDataByCollection["development-logs"];
    draft: boolean;
  }>;

  for (const developmentLog of developmentLogs) {
    await upsertBySlug(
      payload,
      "development-logs",
      developmentLog.data.slug,
      developmentLog.data,
      { draft: developmentLog.draft },
    );
  }
}

/**
 * slugを自然キーとして、同じseedを何度実行しても重複を作らず更新します。
 * 検索時の`draft: true`は、下書き版もupsert対象として見つけるための指定です。
 * なおPayload Local APIは既定でaccess controlを上書きするため、このhelperは
 * 管理用seedだけで使用し、公開リクエストの取得処理には流用しません。
 */
async function upsertBySlug(
  payload: Payload,
  collection: SeedCollection,
  slug: string,
  data: SeedDataByCollection[SeedCollection],
  options: SeedWriteOptions = {},
): Promise<SeedDocumentByCollection[SeedCollection]> {
  const writeData = versionedSeedCollections.has(collection)
    ? {
        ...data,
        // `status`はサイト独自の公開条件、`_status`はPayload versionsの公開状態です。
        _status: options.draft ? ("draft" as const) : ("published" as const),
      }
    : data;
  const existing = await payload.find({
    collection,
    draft: true,
    limit: 1,
    where: {
      slug: {
        equals: slug,
      },
    },
  });

  if (existing.docs[0]) {
    return payload.update({
      collection,
      draft: options.draft,
      id: existing.docs[0].id,
      data: writeData,
    });
  }

  return payload.create({
    collection,
    draft: options.draft,
    data: writeData,
  });
}

function toPayloadBlock(
  block: PageBlock,
  contactFormId: Form["id"],
): PageLayoutBlock {
  switch (block.blockType) {
    case "hero":
      return {
        backgroundImage: undefined,
        blockType: block.blockType,
        ctaText: block.ctaText,
        ctaUrl: block.ctaUrl,
        subtitle: block.subtitle,
        title: block.title,
      };
    case "richText":
      return {
        blockType: block.blockType,
        content: richText(block.content),
      };
    case "features":
      return {
        blockType: block.blockType,
        items: block.items.map((item) => ({
          description: item.description,
          title: item.title,
        })),
        title: block.title,
      };
    case "gallery":
      return {
        blockType: block.blockType,
        images: [],
      };
    case "faq":
      return {
        blockType: block.blockType,
        items: block.items.map((item) => ({
          answer: item.answer,
          question: item.question,
        })),
      };
    case "cta":
      return {
        blockType: block.blockType,
        buttonText: block.buttonText,
        buttonUrl: block.buttonUrl,
        description: block.description,
        title: block.title,
      };
    case "contactForm":
      return {
        blockType: block.blockType,
        description: block.description,
        form: contactFormId,
        title: block.title,
      };
  }
}

function richText(text: string): RichTextDocument {
  return {
    root: {
      children: [
        {
          children: [
            {
              detail: 0,
              format: 0,
              mode: "normal",
              style: "",
              text,
              type: "text",
              version: 1,
            },
          ],
          direction: "ltr",
          format: "",
          indent: 0,
          type: "paragraph",
          version: 1,
        },
      ],
      direction: "ltr",
      format: "",
      indent: 0,
      type: "root",
      version: 1,
    },
  };
}

function firstCategoryId(categories: Record<string, number>) {
  return Object.values(categories)[0];
}
