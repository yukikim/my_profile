import type { CmsPage, PageBlock } from "@/lib/content";

export type SiteTemplateKey = "profile" | "company" | "landing" | "blog";

export type SiteTemplate = {
  key: SiteTemplateKey;
  label: string;
  siteName: string;
  siteDescription: string;
  navigation: { label: string; href: string }[];
  categories: { name: string; slug: string; type: "common" | "post" | "work" }[];
  pages: CmsPage[];
};

const contactCta: PageBlock = {
  blockType: "cta",
  buttonText: "問い合わせる",
  buttonUrl: "/contact",
  description: "CMS構成、ページ設計、公開後の更新運用までまとめて相談できます。",
  title: "サイト構築を相談する",
};

export const siteTemplates: Record<SiteTemplateKey, SiteTemplate> = {
  profile: {
    categories: [
      { name: "CMS", slug: "cms", type: "common" },
      { name: "Frontend", slug: "frontend", type: "common" },
      { name: "Operations", slug: "operations", type: "common" },
    ],
    key: "profile",
    label: "プロフィールサイト",
    navigation: [
      { label: "About", href: "/about" },
      { label: "Works", href: "/works" },
      { label: "Posts", href: "/posts" },
      { label: "Contact", href: "/contact" },
    ],
    pages: [
      templatePage("services", "Services", [
        hero("CMSを前提にしたWebサイト構築"),
        features("提供できること", [
          ["Content Modeling", "更新しやすいCMS構造を設計します。"],
          ["Block Editor", "運用に必要なブロックから実装します。"],
          ["Frontend", "Next.js App Routerで公開ページを実装します。"],
        ]),
        richText(
          "初期段階では過度に汎用化せず、プロフィールサイトとして必要な表示と管理機能に絞ります。",
        ),
        contactCta,
      ]),
    ],
    siteDescription:
      "プロフィール、実績、記事、問い合わせをCMSで管理する個人プロフィールサイト。",
    siteName: "Profile CMS Template",
  },
  company: {
    categories: [
      { name: "News", slug: "news", type: "post" },
      { name: "Case Study", slug: "case-study", type: "work" },
      { name: "Service", slug: "service", type: "common" },
    ],
    key: "company",
    label: "企業サイト",
    navigation: [
      { label: "Services", href: "/services" },
      { label: "Works", href: "/works" },
      { label: "Posts", href: "/posts" },
      { label: "Contact", href: "/contact" },
    ],
    pages: [
      templatePage("services", "Services", [
        hero("事業とサービスをCMSで更新できる企業サイト"),
        features("サービス領域", [
          ["Strategy", "事業紹介、採用、問い合わせ導線を整理します。"],
          ["CMS", "固定ページとニュースを管理画面から更新できます。"],
          ["Growth", "公開後の改善とコンテンツ追加に対応します。"],
        ]),
        contactCta,
      ]),
      templatePage("company", "Company", [
        hero("会社情報"),
        richText("沿革、所在地、代表メッセージなどを固定ページとして管理します。"),
      ]),
    ],
    siteDescription:
      "企業情報、サービス、実績、ニュースを管理できるCMSテンプレート。",
    siteName: "Company CMS Template",
  },
  landing: {
    categories: [
      { name: "Campaign", slug: "campaign", type: "common" },
      { name: "FAQ", slug: "faq", type: "common" },
    ],
    key: "landing",
    label: "ランディングページ",
    navigation: [
      { label: "Features", href: "/features" },
      { label: "FAQ", href: "/faq" },
      { label: "Contact", href: "/contact" },
    ],
    pages: [
      templatePage("features", "Features", [
        hero("成果につながるLPをCMSで素早く編集"),
        features("LP構成", [
          ["Hero", "ファーストビューとCTAを管理します。"],
          ["Benefits", "特徴やベネフィットをカードで整理します。"],
          ["FAQ", "よくある質問を公開後も更新できます。"],
        ]),
        faq(),
        contactCta,
      ]),
    ],
    siteDescription:
      "Hero、特徴、FAQ、CTAを組み替えられるランディングページ用CMSテンプレート。",
    siteName: "Landing Page CMS Template",
  },
  blog: {
    categories: [
      { name: "Blog", slug: "blog", type: "post" },
      { name: "News", slug: "news", type: "post" },
      { name: "Column", slug: "column", type: "post" },
    ],
    key: "blog",
    label: "ブログサイト",
    navigation: [
      { label: "Posts", href: "/posts" },
      { label: "About", href: "/about" },
      { label: "Contact", href: "/contact" },
    ],
    pages: [
      templatePage("about-this-site", "About this site", [
        hero("記事を継続発信するためのCMSブログ"),
        richText(
          "カテゴリ、記事本文、SEO情報を管理し、ブログやニュースを継続的に公開できます。",
        ),
        contactCta,
      ]),
    ],
    siteDescription:
      "ブログ、ニュース、コラムを管理画面から更新できるCMSテンプレート。",
    siteName: "Blog CMS Template",
  },
};

function templatePage(slug: string, title: string, layout: PageBlock[]): CmsPage {
  return {
    layout,
    publishedAt: new Date().toISOString(),
    slug,
    status: "published",
    title,
  };
}

function hero(title: string): PageBlock {
  return {
    blockType: "hero",
    ctaText: "問い合わせる",
    ctaUrl: "/contact",
    subtitle: "テンプレートを複製して、用途に合わせたCMSサイトを構築できます。",
    title,
  };
}

function features(title: string, items: [string, string][]): PageBlock {
  return {
    blockType: "features",
    items: items.map(([itemTitle, description]) => ({
      description,
      title: itemTitle,
    })),
    title,
  };
}

function richText(content: string): PageBlock {
  return {
    blockType: "richText",
    content,
  };
}

function faq(): PageBlock {
  return {
    blockType: "faq",
    items: [
      {
        answer: "管理画面でブロックを追加、削除、並べ替えできます。",
        question: "公開後に構成を変えられますか？",
      },
      {
        answer: "企業サイト、LP、ブログなどに合わせて初期データを切り替えられます。",
        question: "別用途のサイトにも使えますか？",
      },
    ],
  };
}
