import type {
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

export function mapPage(doc: unknown): CmsPage | null {
  const page = asRecord(doc);
  const slug = stringOr(page.slug, "");
  const title = stringOr(page.title, "");

  if (!slug || !title) {
    return null;
  }

  return {
    layout: asArray(page.layout).map(mapBlock).filter(isPageBlock),
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

function mapBlock(blockValue: unknown): PageBlock | null {
  const block = asRecord(blockValue);
  const blockType = stringOr(block.blockType, "");

  switch (blockType) {
    case "hero":
      return {
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
        images: asArray(block.images).map((item) => {
          const media = asRecord(item);

          return {
            alt: stringOr(media.alt, "Gallery image"),
            caption: stringOr(media.caption, undefined),
            color: "#e7ddd0",
          };
        }),
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
        title: stringOr(block.title, ""),
      } satisfies ContactFormBlock;
    default:
      return null;
  }
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

function stringOr<TFallback extends string | undefined>(
  value: unknown,
  fallback: TFallback,
): string | TFallback {
  return typeof value === "string" && value.length > 0 ? value : fallback;
}
