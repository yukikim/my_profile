export type Status = "draft" | "published";

export type Profile = {
  name: string;
  title: string;
  tagline: string;
  introduction: string;
  location: string;
  email: string;
  socials: { label: string; href: string }[];
  skills: string[];
  timeline: { period: string; title: string; description: string }[];
};

export type Work = {
  slug: string;
  title: string;
  summary: string;
  body: string;
  category: string;
  role: string;
  technologies: string[];
  url?: string;
  githubUrl?: string;
  status: Status;
  featured: boolean;
  startDate: string;
  endDate: string;
};

export type Post = {
  slug: string;
  title: string;
  excerpt: string;
  body: string;
  category: string;
  publishedAt: string;
  status: Status;
};

export type Seo = {
  metaTitle?: string;
  metaDescription?: string;
};

export type HeroBlock = {
  blockType: "hero";
  title: string;
  subtitle?: string;
  backgroundImage?: MediaImage;
  ctaText?: string;
  ctaUrl?: string;
};

export type RichTextBlock = {
  blockType: "richText";
  content: string;
  html?: string;
};

export type FeaturesBlock = {
  blockType: "features";
  title: string;
  items: { title: string; description: string }[];
};

export type GalleryBlock = {
  blockType: "gallery";
  images: MediaImage[];
};

export type FaqBlock = {
  blockType: "faq";
  items: Faq[];
};

export type CtaBlock = {
  blockType: "cta";
  title: string;
  description: string;
  buttonText: string;
  buttonUrl: string;
};

export type ContactFormBlock = {
  blockType: "contactForm";
  title: string;
  description: string;
  form?: CmsForm;
};

export type PageBlock =
  | HeroBlock
  | RichTextBlock
  | FeaturesBlock
  | GalleryBlock
  | FaqBlock
  | CtaBlock
  | ContactFormBlock;

export type CmsPage = {
  slug: string;
  title: string;
  status: Status;
  publishedAt?: string;
  seo?: Seo;
  layout: PageBlock[];
};

export type Faq = {
  question: string;
  answer: string;
};

export type MediaImage = {
  alt: string;
  caption?: string;
  color?: string;
  height?: number;
  src?: string;
  width?: number;
};

export type CmsForm = {
  id: string;
  name: string;
  successMessage?: string;
  fields: CmsFormField[];
};

export type CmsFormField = {
  name: string;
  label: string;
  type: "text" | "email" | "textarea";
  required: boolean;
};

export const profile: Profile = {
  name: "Marco Green",
  title: "Product-minded Web Developer",
  tagline: "CMS設計から公開サイトの実装まで、更新し続けられるWeb体験を作ります。",
  introduction:
    "Next.js、TypeScript、CMSを中心に、事業や個人の情報発信を長く運用できる形へ整える開発者です。要件整理、情報設計、UI実装、運用導線の設計を一貫して扱います。",
  location: "Tokyo / Remote",
  email: "hello@example.com",
  socials: [
    { label: "GitHub", href: "https://github.com/" },
    { label: "LinkedIn", href: "https://www.linkedin.com/" },
    { label: "X", href: "https://x.com/" },
  ],
  skills: [
    "Next.js",
    "TypeScript",
    "Payload CMS",
    "PostgreSQL",
    "Design Systems",
    "Content Modeling",
    "SEO",
    "Performance",
  ],
  timeline: [
    {
      period: "2024 - Now",
      title: "CMS / Frontend Developer",
      description:
        "ブロックエディタ型CMS、プロフィールサイト、実績紹介サイトの設計と実装を担当。",
    },
    {
      period: "2021 - 2024",
      title: "Frontend Engineer",
      description:
        "Next.js と TypeScript を使った業務画面、公開サイト、コンポーネント基盤を開発。",
    },
    {
      period: "Before 2021",
      title: "Web Producer",
      description:
        "Webサイト制作の要件整理、進行管理、コンテンツ設計、公開後の改善運用を経験。",
    },
  ],
};

export const works: Work[] = [
  {
    slug: "profile-cms-foundation",
    title: "プロフィールCMS基盤",
    summary:
      "個人プロフィール、実績、記事、問い合わせを一元管理するPayload CMS想定の情報設計。",
    body:
      "固定ページ、実績、記事、カテゴリ、メディアを分け、公開状態とSEO情報を持つCMS基盤を設計しました。トップページはブロック構成に対応し、将来的な企業サイトやLPへの転用も見据えています。",
    category: "CMS",
    role: "Information architecture / Frontend implementation",
    technologies: ["Next.js", "TypeScript", "Payload CMS", "PostgreSQL"],
    status: "published",
    featured: true,
  },
  {
    slug: "portfolio-performance-redesign",
    title: "ポートフォリオ高速化リニューアル",
    summary:
      "表示速度、導線、実績の見せ方を見直したポートフォリオサイト改善。",
    body:
      "画像配信、ページ構造、カードUIを整理し、採用担当者や見込み顧客が短時間で判断できる構成へ改善しました。実績詳細では担当範囲と技術選定の理由を明確に表示しています。",
    category: "Frontend",
    role: "UI design / Performance tuning",
    technologies: ["Next.js", "React", "Tailwind CSS"],
    status: "published",
    featured: true,
  },
  {
    slug: "content-operations-playbook",
    title: "コンテンツ運用プレイブック",
    summary:
      "記事、ニュース、固定ページを運用チームが迷わず更新できる編集ルールを整備。",
    body:
      "CMSのフィールド定義、入力ガイド、公開フローを整理し、編集者がコードに触れずにコンテンツを更新できる状態を作りました。カテゴリとタグの使い分けも明文化しています。",
    category: "Operations",
    role: "CMS modeling / Documentation",
    technologies: ["Payload CMS", "Content Strategy", "SEO"],
    status: "published",
    featured: false,
  },
];

export const posts: Post[] = [
  {
    slug: "cms-first-profile-site",
    title: "プロフィールサイトをCMS前提で作る理由",
    excerpt:
      "個人サイトでも更新導線を先に設計すると、実績や記事を継続して積み上げやすくなります。",
    body:
      "プロフィールサイトは一度作って終わりではなく、経歴、実績、記事、問い合わせ導線を更新し続ける媒体です。CMSを前提にすると、コンテンツの責務が明確になり、後から企業サイトやLPへ展開する時にも構成を再利用できます。",
    category: "CMS",
    publishedAt: "2026-06-10",
    status: "published",
  },
  {
    slug: "block-editor-minimum",
    title: "最初のブロックエディタは小さく始める",
    excerpt:
      "Hero、RichText、CTAから始めると、過度な汎用化を避けつつページ編集の価値を出せます。",
    body:
      "初期段階のブロックエディタは、すべての表現を網羅するよりも、公開サイトで確実に使うブロックへ絞る方が運用しやすくなります。よく使うブロックから型と表示コンポーネントを揃え、必要に応じてGalleryやFAQを追加します。",
    category: "Frontend",
    publishedAt: "2026-06-08",
    status: "published",
  },
  {
    slug: "draft-published-boundary",
    title: "下書きと公開済みの境界をUIにも反映する",
    excerpt:
      "CMSのstatus設計は、公開ページの取得条件と管理画面の編集体験を同時に決めます。",
    body:
      "公開前コンテンツが一般閲覧者に出ないように、コレクションにはdraftとpublishedの状態を持たせます。公開ページではpublishedのみを取得し、プレビューや管理画面では状態を明確に見分けられる設計にします。",
    category: "Operations",
    publishedAt: "2026-06-05",
    status: "published",
  },
];

export const faqs: Faq[] = [
  {
    question: "Payload CMSの導入はこのあと可能ですか？",
    answer:
      "可能です。現在の表示層はデータ取得をlibに閉じ込めているため、PayloadのLocal APIまたはREST APIへ差し替えやすい構成です。",
  },
  {
    question: "どの範囲から依頼できますか？",
    answer:
      "プロフィールサイトの初期構築、CMS設計、既存サイトのコンテンツ管理化、パフォーマンス改善などを相談できます。",
  },
  {
    question: "公開後の更新も対応できますか？",
    answer:
      "記事や実績の追加、ブロック追加、SEO改善、CMSフィールドの拡張まで継続的に対応できます。",
  },
];

export const pages: CmsPage[] = [
  {
    slug: "services",
    title: "Services",
    status: "published",
    publishedAt: "2026-06-01",
    seo: {
      metaTitle: "Services",
      metaDescription:
        "プロフィールサイト、CMS設計、ブロックエディタ実装の提供領域。",
    },
    layout: [
      {
        blockType: "hero",
        title: "CMSを前提にしたWebサイト構築",
        subtitle:
          "プロフィールサイト、企業サイト、LPへ転用しやすい構成で、公開後の更新導線まで整えます。",
        ctaText: "相談する",
        ctaUrl: "/contact",
      },
      {
        blockType: "features",
        title: "提供できること",
        items: [
          {
            title: "Content Modeling",
            description:
              "Pages、Works、Posts、Categories、Mediaの責務を分け、更新しやすいCMS構造を設計します。",
          },
          {
            title: "Block Editor",
            description:
              "Hero、RichText、Features、FAQ、CTAなど、運用に必要なブロックから実装します。",
          },
          {
            title: "Frontend",
            description:
              "Next.js App Routerで公開ページ、詳細ページ、問い合わせ導線を実装します。",
          },
        ],
      },
      {
        blockType: "richText",
        content:
          "初期段階では過度に汎用化せず、プロフィールサイトとして必要な表示と管理機能に絞ります。そのうえで、企業サイトやLPへ展開できるようにブロックと取得関数の境界を保ちます。",
      },
      {
        blockType: "cta",
        title: "最初のCMS構成から相談できます",
        description:
          "要件整理、コレクション設計、公開ページの優先順位づけまで対応します。",
        buttonText: "お問い合わせへ",
        buttonUrl: "/contact",
      },
    ],
  },
  {
    slug: "process",
    title: "Process",
    status: "published",
    publishedAt: "2026-06-01",
    seo: {
      metaTitle: "Process",
      metaDescription: "プロフィールサイト構築の進め方。",
    },
    layout: [
      {
        blockType: "hero",
        title: "小さく作って、運用しながら育てる",
        subtitle:
          "初期公開に必要なページとCMS項目を優先し、公開後の実績追加や記事運用に合わせて拡張します。",
      },
      {
        blockType: "features",
        title: "進行ステップ",
        items: [
          {
            title: "1. 要件整理",
            description:
              "公開ページ、管理したい項目、問い合わせ導線、将来拡張を整理します。",
          },
          {
            title: "2. CMS設計",
            description:
              "Collections、Globals、Blocks、公開状態、SEO項目を設計します。",
          },
          {
            title: "3. 実装と検証",
            description:
              "Next.jsで公開ページを実装し、CMS連携後も表示が崩れない構成にします。",
          },
        ],
      },
      {
        blockType: "faq",
        items: faqs,
      },
    ],
  },
];

export const siteNavigation = [
  { label: "About", href: "/about" },
  { label: "Works", href: "/works" },
  { label: "Posts", href: "/posts" },
  { label: "Contact", href: "/contact" },
];

export function getPublishedWorks() {
  return works.filter((work) => isPublished(work));
}

export function getFeaturedWorks() {
  return getPublishedWorks().filter((work) => work.featured);
}

export function getWorkBySlug(slug: string) {
  return getPublishedWorks().find((work) => work.slug === slug);
}

export function getPublishedPosts() {
  return posts
    .filter((post) => isPublished(post))
    .sort(
      (a, b) =>
        new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
    );
}

export function getPostBySlug(slug: string) {
  return getPublishedPosts().find((post) => post.slug === slug);
}

export function getPublishedPages() {
  return pages.filter((page) => isPublished(page));
}

export function getPageBySlug(slug: string) {
  return getPublishedPages().find((page) => page.slug === slug);
}

function isPublished(content: { status: Status; publishedAt?: string }) {
  if (content.status !== "published") {
    return false;
  }

  if (!content.publishedAt) {
    return true;
  }

  return new Date(content.publishedAt).getTime() <= Date.now();
}
