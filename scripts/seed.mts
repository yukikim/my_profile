import { postgresAdapter } from "@payloadcms/db-postgres";
import { lexicalEditor } from "@payloadcms/richtext-lexical";
import nextEnv from "@next/env";
import path from "path";
import { buildConfig } from "payload";
import { getPayload, type Payload } from "payload";
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
import { siteTemplates, type SiteTemplateKey } from "@/lib/templates/siteTemplates";
import type { PageBlock } from "@/lib/content";
import type {
  Category,
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

type SeedCollection = "categories" | "pages" | "posts" | "works";
type SeedDataByCollection = {
  categories: Pick<Category, "description" | "name" | "slug" | "type">;
  pages: Pick<Page, "layout" | "publishedAt" | "slug" | "status" | "title">;
  posts: Pick<PayloadPost, "categories" | "content" | "excerpt" | "publishedAt" | "slug" | "status" | "title">;
  works: Pick<PayloadWork, "categories" | "content" | "endDate" | "excerpt" | "featured" | "publishedAt" | "role" | "slug" | "startDate" | "status" | "techStack" | "title">;
};
type SeedDocumentByCollection = {
  categories: Category;
  pages: Page;
  posts: PayloadPost;
  works: PayloadWork;
};
type RichTextDocument = PayloadProfile["bio"];
type PageLayoutBlock = NonNullable<Page["layout"]>[number];

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
    ],
    db: postgresAdapter({
      migrationDir: path.resolve(projectRoot, "migrations"),
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
    await seedWorks(payload, categories);

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
    const doc = await upsertBySlug(payload, "categories", category.slug, category);

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
    successMessage: "お問い合わせありがとうございます。内容を確認して返信します。",
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
          description: "Payload CMS と Next.js を使ったサイトテンプレートを整備。",
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

async function seedPosts(
  payload: Payload,
  categories: Record<string, number>,
) {
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

async function seedWorks(
  payload: Payload,
  categories: Record<string, number>,
) {
  const categoryId = firstCategoryId(categories);

  await upsertBySlug(payload, "works", "starter-showcase", {
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

async function upsertBySlug(
  payload: Payload,
  collection: SeedCollection,
  slug: string,
  data: SeedDataByCollection[typeof collection],
): Promise<SeedDocumentByCollection[typeof collection]> {
  const existing = await payload.find({
    collection,
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
      id: existing.docs[0].id,
      data,
    });
  }

  return payload.create({
    collection,
    data,
  });
}

function toPayloadBlock(block: PageBlock, contactFormId: Form["id"]): PageLayoutBlock {
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
