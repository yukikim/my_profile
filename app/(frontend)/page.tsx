import Link from "next/link";
import { PostCard, WorkCard } from "@/components/content-cards";
import { ScrollingBackgroundOrbs } from "@/components/scrolling-background-orbs-top";
import { getPosts } from "@/lib/payload/getPosts";
import { getProfile } from "@/lib/payload/getProfile";
import { getFeaturedWorks } from "@/lib/payload/getWorks";
import { LinkButton } from "@/components/link-button";
import { getWorks } from "@/lib/payload/getWorks";

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
      <h2 className="mt-3 text-4xl font-bold leading-tight tracking-tight text-main-text sm:text-4xl lg:text-5xl">
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

  const works = await getWorks();
  const posts = await getPosts();
  const metrics = [
    { label: "Works", value: works.length, className: "bg-teal-100" },
    { label: "Posts", value: posts.length, className: "bg-teal-50" },
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
            <h1 className="mt-6 text-3xl font-bold leading-[1.18] tracking-[-0.04em] text-main-text sm:text-4xl lg:text-5xl">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="1.5"
                stroke="currentColor"
                className="size-16 inline-block mr-2 align-[-14px]"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"
                />
              </svg>
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
                わたしについて&nbsp;{" "}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="1.5"
                  stroke="currentColor"
                  className="size-6"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="m12.75 15 3-3m0 0-3-3m3 3h-7.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                  />
                </svg>
              </Link>
              <Link
                href="/works"
                className="inline-flex min-h-12 items-center justify-center rounded-full border border-teal-200 bg-white px-6 text-sm font-semibold text-teal-700 transition hover:border-teal-500 hover:bg-teal-100 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
              >
                職務経歴&nbsp;{" "}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="1.5"
                  stroke="currentColor"
                  className="size-6"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="m12.75 15 3-3m0 0-3-3m3 3h-7.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                  />
                </svg>
              </Link>
              <Link
                href="/engineering-notes"
                className="inline-flex min-h-12 items-center justify-center rounded-full border border-teal-200 bg-white px-6 text-sm font-semibold text-teal-700 transition hover:border-teal-500 hover:bg-teal-100 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
              >
                開発ノート&nbsp;{" "}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="1.5"
                  stroke="currentColor"
                  className="size-6"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="m12.75 15 3-3m0 0-3-3m3 3h-7.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                  />
                </svg>
              </Link>
            </div>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-md sm:p-8">
            <div className="flex items-center justify-between gap-4">
              <p className="text-xs font-semibold tracking-[0.12em] text-teal-700 uppercase">
                Content Momentum
              </p>
              <span className="rounded-full bg-yellow-300 px-3 py-1 text-xs font-semibold text-slate-950">
                LIVE
              </span>
            </div>
            <div className="mt-5 rounded-2xl shadow-sm bg-teal-500 p-6 text-white">
              <p className="text-sm">Payload CMS で管理されるコンテンツ</p>
              <p className="mt-2 text-2xl font-bold tracking-tight sm:text-4xl">
                This is a CMS site.
              </p>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-3 sm:gap-4">
              {metrics.map((metric) => (
                <div
                  key={metric.label}
                  className={`rounded-2xl shadow-sm p-4 sm:p-5 ${metric.className}`}
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

      <section className="bg-teal-50/50">
        <div className="mx-auto w-full max-w-7xl px-5 py-16 sm:px-8 sm:py-20 lg:px-10 lg:py-24">
          <SectionHeading
            eyebrow="Working history"
            title="職務経歴"
            description="これまでに携わった主要な業務を紹介します"
          />
          <div className="mt-10 grid gap-6 md:grid-cols-2">
            {featuredWorks.map((work) => (
              <WorkCard key={work.slug} work={work} />
            ))}
          </div>
          <div className="mt-4 text-right">
            <LinkButton href="/works">
              職務経歴を見る&nbsp;{" "}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="1.5"
                stroke="currentColor"
                className="size-6"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="m12.75 15 3-3m0 0-3-3m3 3h-7.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                />
              </svg>
            </LinkButton>
          </div>
        </div>
      </section>

      <section className="bg-white/50">
        <div className="mx-auto w-full max-w-7xl px-5 py-16 sm:px-8 sm:py-20 lg:px-10 lg:py-24">
          <SectionHeading
            eyebrow="Latest Posts"
            title="最新Post"
            description="思いつくままに、いろんなことを書き留めています。"
          />
          <div className="mt-10 grid gap-6 md:grid-cols-2">
            {latestPosts.map((post) => (
              <PostCard key={post.slug} post={post} />
            ))}
          </div>
          <div className="mt-4 text-right">
            <LinkButton href="/posts">
              記事一覧を見る&nbsp;{" "}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="1.5"
                stroke="currentColor"
                className="size-6"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="m12.75 15 3-3m0 0-3-3m3 3h-7.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                />
              </svg>
            </LinkButton>
          </div>
        </div>
      </section>

      <section className="bg-white/50">
        <div className="mx-auto w-full max-w-7xl px-5 py-16 sm:px-8 sm:py-20 lg:px-10 lg:py-24">
          <SectionHeading
            eyebrow="Dev Notes"
            title="開発日誌"
            description="設計と実装の気づきを、次の改善につなげます。"
          />
          <div className="mt-4">
            <LinkButton href="/engineering-notes">
              開発日誌&nbsp;
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="1.5"
                stroke="currentColor"
                className="size-6"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="m12.75 15 3-3m0 0-3-3m3 3h-7.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                />
              </svg>
            </LinkButton>
          </div>
        </div>
      </section>

      <section className="overflow-hidden bg-teal-700/60 text-white">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-5 py-14 sm:px-8 sm:py-18 md:flex-row md:items-center md:justify-between lg:px-10 lg:py-20">
          <div>
            <p className="text-xs font-semibold tracking-[0.12em] uppercase">
              Let&apos;s make it move
            </p>
            <h2 className="mt-3 text-4xl font-bold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
              アイデアを、次の一歩へ。
            </h2>
            <p className="mt-4 text-lg leading-8 text-teal-50">
              ウェブ開発に関するご相談など、お気軽にお問い合わせください。
            </p>
          </div>
          <div className="flex items-center gap-6">
            <Link
              href="/contact"
              className="inline-flex min-h-12 items-center justify-center rounded-full bg-white px-6 text-sm font-semibold text-teal-700 transition hover:bg-teal-50 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-teal-500"
            >
              お問い合わせへ&nbsp;{" "}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="1.5"
                stroke="currentColor"
                className="size-6"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="m12.75 15 3-3m0 0-3-3m3 3h-7.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                />
              </svg>
            </Link>
            {/* <span
              className="hidden size-16 shrink-0 rounded-full bg-yellow-300 lg:block"
              aria-hidden="true"
            /> */}
          </div>
        </div>
      </section>
    </>
  );
}
