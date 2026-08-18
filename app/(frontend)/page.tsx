import Link from "next/link";
import { PostCard, WorkCard } from "@/components/content-cards";
import { ScrollingBackgroundOrbs } from "@/components/scrolling-background-orbs";
import { faqs } from "@/lib/content";
import { getPosts } from "@/lib/payload/getPosts";
import { getProfile } from "@/lib/payload/getProfile";
import { getFeaturedWorks } from "@/lib/payload/getWorks";

const capabilities = [
  ["CMS", "プロフィール、実績、記事を一元管理", "bg-teal-100"],
  ["Blocks", "ページを柔軟に編集", "bg-yellow-300"],
  ["Deploy", "Vercel運用を想定", "bg-teal-100"],
  ["SEO", "公開状態まで管理", "bg-teal-50"],
] as const;

function SectionHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div>
      <p className="text-xs font-semibold tracking-[0.12em] text-teal-700 uppercase">
        {eyebrow}
      </p>
      <h2 className="mt-3 text-4xl font-bold leading-tight tracking-tight text-main-text sm:text-5xl lg:text-6xl">
        {title}
      </h2>
      <p className="mt-4 max-w-2xl text-lg leading-8 text-slate-700">
        {description}
      </p>
    </div>
  );
}

export default async function Home() {
  const [featuredWorks, latestPosts, profile] = await Promise.all([
    getFeaturedWorks(),
    getPosts().then((posts) => posts.slice(0, 2)),
    getProfile(),
  ]);

  const metrics = [
    { label: "Works", value: featuredWorks.length, className: "bg-teal-100" },
    { label: "Posts", value: latestPosts.length, className: "bg-teal-50" },
    {
      label: "Skills",
      value: profile.skills.length,
      className: "bg-yellow-300",
    },
  ];

  return (
    <>
      <section className="relative">
        <ScrollingBackgroundOrbs />

        <div className="mx-auto grid min-h-[calc(100svh-5.25rem)] w-full max-w-7xl items-top gap-12 px-5 py-14 sm:px-8 lg:grid-cols-[1.08fr_0.92fr] lg:px-10 lg:pt-36 lg:pb-76">
          <div>
            <p className="hidden sm:inline-flex rounded-full bg-teal-100 px-4 py-2 text-xs font-semibold tracking-[0.12em] text-teal-700 uppercase">
              ●&nbsp; Profile and Professional Experience
            </p>
            <h1 className="mt-6 text-[2.0rem] font-bold leading-[1.18] tracking-[-0.04em] text-main-text sm:text-4xl lg:text-5xl">
              わたしのプロフィール
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-slate-700">
              {profile.tagline}
            </p>
            <div className="mt-8 flex flex-col gap-2 sm:flex-row">
              <Link
                href="/about"
                className="inline-flex min-h-12 items-center justify-center rounded-full border border-teal-200 bg-white px-6 text-sm font-semibold text-teal-700 transition hover:border-teal-500 hover:bg-teal-100 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
              >
                わたしについて&nbsp; →
              </Link>
              <Link
                href="/works"
                className="inline-flex min-h-12 items-center justify-center rounded-full border border-teal-200 bg-white px-6 text-sm font-semibold text-teal-700 transition hover:border-teal-500 hover:bg-teal-100 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
              >
                職務経歴&nbsp; →
              </Link>
              <Link
                href="/engineering-notes"
                className="inline-flex min-h-12 items-center justify-center rounded-full border border-teal-200 bg-white px-6 text-sm font-semibold text-teal-700 transition hover:border-teal-500 hover:bg-teal-100 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
              >
                開発ノート&nbsp; →
              </Link>
            </div>
          </div>

          <div className="rounded-[2rem] bg-white p-6 shadow-[var(--bright-shadow-floating)] sm:p-8">
            <div className="flex items-center justify-between gap-4">
              <p className="text-xs font-semibold tracking-[0.12em] text-teal-700 uppercase">
                Content Momentum
              </p>
              <span className="rounded-full bg-yellow-300 px-3 py-1 text-xs font-semibold text-slate-950">
                LIVE
              </span>
            </div>
            <div className="mt-5 rounded-3xl bg-teal-500 p-6 text-white">
              <p className="text-sm">更新できるコンテンツ</p>
              <p className="mt-2 text-2xl font-bold tracking-tight sm:text-4xl">
                This is a CMS site.
              </p>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-3 sm:gap-4">
              {metrics.map((metric) => (
                <div
                  key={metric.label}
                  className={`rounded-2xl p-4 sm:p-5 ${metric.className}`}
                >
                  <p className="text-3xl font-bold tracking-tight text-slate-500 sm:text-4xl">
                    {String(metric.value).padStart(2, "0")}
                  </p>
                  <p className="mt-1 text-xs font-medium text-slate-600">
                    {metric.label}
                  </p>
                </div>
              ))}
            </div>
            <p className="mt-5 text-sm text-slate-600">
              Next.js&nbsp; • &nbsp;Payload CMS&nbsp; • &nbsp;PostgreSQL
            </p>
          </div>
        </div>
      </section>

      <section className="bg-white/50">
        <div className="mx-auto grid w-full max-w-7xl gap-12 px-5 py-16 sm:px-8 sm:py-20 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16 lg:px-10 lg:py-24">
          <div>
            <p className="text-xs font-semibold tracking-[0.12em] text-teal-700 uppercase">
              Profile
            </p>
            <h2 className="mt-4 text-4xl font-bold leading-tight tracking-tight text-main-text sm:text-5xl lg:text-6xl">
              更新のたびに、
              <br />
              サイトが強くなる。
            </h2>
            <p className="mt-6 max-w-xl text-lg leading-8 text-slate-700">
              {profile.introduction}
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {capabilities.map(([title, text, className]) => (
              <article key={title} className={`rounded-3xl p-6 ${className}`}>
                <h3 className="text-2xl font-bold text-slate-950">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-700">{text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-teal-50/50">
        <div className="mx-auto w-full max-w-7xl px-5 py-16 sm:px-8 sm:py-20 lg:px-10 lg:py-24">
          <SectionHeading
            eyebrow="Featured Works"
            title="主要実績"
            description="仕組みと体験を一緒に整え、運用しやすい形へ。"
          />
          <div className="mt-10 grid gap-6 md:grid-cols-2">
            {featuredWorks.map((work) => (
              <WorkCard key={work.slug} work={work} />
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white/50">
        <div className="mx-auto w-full max-w-7xl px-5 py-16 sm:px-8 sm:py-20 lg:px-10 lg:py-24">
          <SectionHeading
            eyebrow="Latest Posts"
            title="最新記事"
            description="設計と実装の気づきを、次の改善につなげます。"
          />
          <div className="mt-10 grid gap-6 md:grid-cols-2">
            {latestPosts.map((post) => (
              <PostCard key={post.slug} post={post} />
            ))}
          </div>
        </div>
      </section>

      <section className="bg-teal-50/50">
        <div className="mx-auto w-full max-w-7xl px-5 py-16 sm:px-8 sm:py-20 lg:px-10 lg:py-24">
          <SectionHeading
            eyebrow="FAQ"
            title="よくある質問"
            description="最初の相談でよくいただく質問をまとめました。"
          />
          <div className="mt-10 grid gap-3">
            {faqs.map((faq) => (
              <details
                key={faq.question}
                className="group rounded-2xl border border-teal-200 bg-white px-5 py-5 sm:px-6"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-5 text-lg font-bold text-slate-950 marker:hidden">
                  {faq.question}
                  <span
                    className="text-2xl font-medium text-teal-600 transition group-open:rotate-45"
                    aria-hidden="true"
                  >
                    ＋
                  </span>
                </summary>
                <p className="mt-4 max-w-4xl leading-7 text-slate-700">
                  {faq.answer}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="overflow-hidden bg-teal-500/50 text-white">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-5 py-14 sm:px-8 sm:py-18 md:flex-row md:items-center md:justify-between lg:px-10 lg:py-20">
          <div>
            <p className="text-xs font-semibold tracking-[0.12em] uppercase">
              Let&apos;s make it move
            </p>
            <h2 className="mt-3 text-4xl font-bold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
              アイデアを、次の一歩へ。
            </h2>
            <p className="mt-4 text-lg leading-8 text-teal-50">
              プロフィールサイトやCMS構築を、気軽に相談してください。
            </p>
          </div>
          <div className="flex items-center gap-6">
            <Link
              href="/contact"
              className="inline-flex min-h-12 items-center justify-center rounded-full bg-white px-6 text-sm font-semibold text-teal-700 transition hover:bg-teal-50 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-teal-500"
            >
              お問い合わせへ&nbsp; →
            </Link>
            <span
              className="hidden size-16 shrink-0 rounded-full bg-yellow-300 lg:block"
              aria-hidden="true"
            />
          </div>
        </div>
      </section>
    </>
  );
}
