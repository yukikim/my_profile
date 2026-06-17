import { convertLexicalToHTMLAsync } from "@payloadcms/richtext-lexical/html-async";
import type {
  CmsForm,
  CmsFormField,
  CmsPage,
  ContactFormBlock,
  CtaBlock,
  FaqBlock,
  FeaturesBlock,
  GalleryBlock,
  HeroBlock,
  PageBlock,
  Post,
  Profile,
  RichTextBlock,
  Work,
} from "@/lib/content";

type JsonRecord = Record<string, unknown>;

export function richTextToPlainText(value: unknown): string {
  const text = collectText(value, new WeakSet())
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();

  return text;
}

export function mapProfile(doc: unknown, fallback: Profile): Profile {
  const profile = asRecord(doc);
  const skills = asArray(profile.skills)
    .map((item) => asRecord(item).skill)
    .filter(isString);
  const careers = asArray(profile.careers)
    .map((item) => {
      const career = asRecord(item);

      return {
        description: stringOr(career.description, ""),
        period: stringOr(career.period, ""),
        title: stringOr(career.title, ""),
      };
    })
    .filter((item) => item.period || item.title || item.description);
  const socials = asArray(profile.snsLinks)
    .map((item) => {
      const link = asRecord(item);

      return {
        href: stringOr(link.url, ""),
        label: stringOr(link.label, ""),
      };
    })
    .filter((item) => item.href && item.label);

  return {
    ...fallback,
    introduction: richTextToPlainText(profile.bio) || fallback.introduction,
    name: stringOr(profile.name, fallback.name),
    skills: skills.length ? skills : fallback.skills,
    socials: socials.length ? socials : fallback.socials,
    tagline: stringOr(profile.title, fallback.tagline),
    timeline: careers.length ? careers : fallback.timeline,
    title: stringOr(profile.title, fallback.title),
  };
}

export function mapWork(doc: unknown): Work | null {
  const work = asRecord(doc);
  const slug = stringOr(work.slug, "");
  const title = stringOr(work.title, "");

  if (!slug || !title) {
    return null;
  }

  return {
    body: richTextToPlainText(work.content),
    category: firstRelationshipLabel(work.categories, "Work"),
    featured: Boolean(work.featured),
    githubUrl: stringOr(work.repositoryUrl, undefined),
    role: stringOr(work.role, "Project"),
    slug,
    status: "published",
    summary: stringOr(work.excerpt, ""),
    technologies: asArray(work.techStack)
      .map((item) => asRecord(item).technology)
      .filter(isString),
    title,
    url: stringOr(work.projectUrl, undefined),
  };
}

export function mapPost(doc: unknown): Post | null {
  const post = asRecord(doc);
  const slug = stringOr(post.slug, "");
  const title = stringOr(post.title, "");

  if (!slug || !title) {
    return null;
  }

  return {
    body: richTextToPlainText(post.content),
    category: firstRelationshipLabel(post.categories, "Post"),
    excerpt: stringOr(post.excerpt, ""),
    publishedAt: stringOr(post.publishedAt, ""),
    slug,
    status: "published",
    title,
  };
}

export async function mapPage(doc: unknown): Promise<CmsPage | null> {
  const page = asRecord(doc);
  const slug = stringOr(page.slug, "");
  const title = stringOr(page.title, "");

  if (!slug || !title) {
    return null;
  }

  return {
    layout: (await Promise.all(asArray(page.layout).map(mapBlock))).filter(
      isPageBlock,
    ),
    publishedAt: stringOr(page.publishedAt, undefined),
    seo: mapSeo(page.seo),
    slug,
    status: "published",
    title,
  };
}

export function mapNavigation(value: unknown) {
  return asArray(value)
    .map((item) => {
      const link = asRecord(item);

      return {
        href: stringOr(link.href, ""),
        label: stringOr(link.label, ""),
      };
    })
    .filter((item) => item.href && item.label);
}

export function mapSnsLinks(value: unknown) {
  return asArray(value)
    .map((item) => {
      const link = asRecord(item);

      return {
        href: stringOr(link.url, ""),
        label: stringOr(link.label, ""),
      };
    })
    .filter((item) => item.href && item.label);
}

async function mapBlock(blockValue: unknown): Promise<PageBlock | null> {
  const block = asRecord(blockValue);
  const blockType = stringOr(block.blockType, "");

  switch (blockType) {
    case "hero":
      return {
        backgroundImage: mapMedia(block.backgroundImage),
        blockType,
        ctaText: stringOr(block.ctaText, undefined),
        ctaUrl: stringOr(block.ctaUrl, undefined),
        subtitle: stringOr(block.subtitle, undefined),
        title: stringOr(block.title, ""),
      } satisfies HeroBlock;
    case "richText":
      return {
        blockType,
        content: richTextToPlainText(block.content),
        html: await richTextToHtml(block.content),
      } satisfies RichTextBlock;
    case "features":
      return {
        blockType,
        items: asArray(block.items).map((item) => {
          const feature = asRecord(item);

          return {
            description: stringOr(feature.description, ""),
            title: stringOr(feature.title, ""),
          };
        }),
        title: stringOr(block.title, ""),
      } satisfies FeaturesBlock;
    case "gallery":
      return {
        blockType,
        images: asArray(block.images)
          .map(mapMedia)
          .filter((image) => image.src || image.color),
      } satisfies GalleryBlock;
    case "faq":
      return {
        blockType,
        items: asArray(block.items).map((item) => {
          const faq = asRecord(item);

          return {
            answer: stringOr(faq.answer, ""),
            question: stringOr(faq.question, ""),
          };
        }),
      } satisfies FaqBlock;
    case "cta":
      return {
        blockType,
        buttonText: stringOr(block.buttonText, ""),
        buttonUrl: stringOr(block.buttonUrl, ""),
        description: stringOr(block.description, ""),
        title: stringOr(block.title, ""),
      } satisfies CtaBlock;
    case "contactForm":
      return {
        blockType,
        description: stringOr(block.description, ""),
        form: mapForm(block.form),
        title: stringOr(block.title, ""),
      } satisfies ContactFormBlock;
    default:
      return null;
  }
}

async function richTextToHtml(value: unknown): Promise<string | undefined> {
  if (!isLexicalEditorState(value)) {
    return undefined;
  }

  return convertLexicalToHTMLAsync({
    data: value,
    disableContainer: true,
  });
}

function mapForm(value: unknown): CmsForm | undefined {
  const form = asRecord(value);
  const id = stringOr(form.id, "");
  const name = stringOr(form.name, "");

  if (!id || !name) {
    return undefined;
  }

  return {
    fields: asArray(form.fields)
      .map((item) => {
        const field = asRecord(item);
        const type = stringOr(field.type, "text");
        const normalizedType: CmsFormField["type"] =
          type === "email" || type === "textarea" || type === "text"
            ? type
            : "text";

        return {
          label: stringOr(field.label, ""),
          name: stringOr(field.name, ""),
          required: Boolean(field.required),
          type: normalizedType,
        };
      })
      .filter((field) => field.name && field.label),
    id,
    name,
    successMessage: stringOr(form.successMessage, undefined),
  };
}

function mapMedia(value: unknown) {
  const media = asRecord(value);
  const sizes = asRecord(media.sizes);
  const thumbnail = asRecord(sizes.thumbnail);
  const src = stringOr(thumbnail.url, stringOr(media.url, undefined));

  return {
    alt: stringOr(media.alt, "Image"),
    caption: stringOr(media.caption, undefined),
    color: "#e7ddd0",
    height: numberOr(thumbnail.height, numberOr(media.height, undefined)),
    src,
    width: numberOr(thumbnail.width, numberOr(media.width, undefined)),
  };
}

function mapSeo(value: unknown) {
  const seo = asRecord(value);

  return {
    metaDescription: stringOr(seo.metaDescription, undefined),
    metaTitle: stringOr(seo.metaTitle, undefined),
  };
}

function firstRelationshipLabel(value: unknown, fallback: string): string {
  const first = asArray(value)[0];

  if (typeof first === "string" || typeof first === "number") {
    return fallback;
  }

  const item = asRecord(first);

  return stringOr(item.name, fallback);
}

function collectText(value: unknown, seen: WeakSet<object>): string[] {
  if (typeof value === "string") {
    return [value];
  }

  if (Array.isArray(value)) {
    return value.flatMap((item) => collectText(item, seen));
  }

  if (!value || typeof value !== "object") {
    return [];
  }

  if (seen.has(value)) {
    return [];
  }

  seen.add(value);

  const record = value as JsonRecord;
  const ownText = typeof record.text === "string" ? [record.text] : [];

  return [
    ...ownText,
    ...collectText(record.children, seen),
    ...collectText(record.root, seen),
  ];
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function asRecord(value: unknown): JsonRecord {
  return value && typeof value === "object" ? (value as JsonRecord) : {};
}

function isString(value: unknown): value is string {
  return typeof value === "string" && value.length > 0;
}

function isPageBlock(value: PageBlock | null): value is PageBlock {
  return value !== null;
}

function isLexicalEditorState(
  value: unknown,
): value is Parameters<typeof convertLexicalToHTMLAsync>[0]["data"] {
  const record = asRecord(value);
  const root = asRecord(record.root);

  return Array.isArray(root.children);
}

function numberOr<TFallback extends number | undefined>(
  value: unknown,
  fallback: TFallback,
): number | TFallback {
  return typeof value === "number" ? value : fallback;
}

function stringOr<TFallback extends string | undefined>(
  value: unknown,
  fallback: TFallback,
): string | TFallback {
  return typeof value === "string" && value.length > 0 ? value : fallback;
}
