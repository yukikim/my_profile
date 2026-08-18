import Link from "next/link";
import type { Post, Work } from "@/lib/content";
import { Badge } from "@/components/site-shell";
import {
  formatApproximateMonthDuration,
  formatSlashDate,
} from "@/lib/formatDate";

export function WorkCard({ work }: { work: Work }) {
  return (
    <article className="grid min-h-80 overflow-hidden rounded-3xl border border-teal-200 bg-white shadow-xs transition duration-300">
      <div className="mx-4 mt-6 h-1 rounded-full bg-yellow-300" />
      <div className="flex h-full flex-col p-4 pt-4 sm:p-6 sm:pt-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge>{work.category}</Badge>
          <span className="text-sm text-slate-500">{work.role}</span>
        </div>
        <p className="font-medium text-sm text-right">
          <span className="font-bold text-xs">期間</span>: {formatSlashDate(work.startDate)} -{" "}
          {formatSlashDate(work.endDate)}（
          {formatApproximateMonthDuration(work.startDate, work.endDate)}）
        </p>
        <h3 className="mt-5 text-2xl font-bold leading-snug text-slate-950">
          {work.title}
        </h3>
        <p className="mt-3 flex-1 text-base leading-7 text-slate-700">
          {work.summary}
        </p>
        <div className=" bg-amber-100 p-2 mt-4 rounded-xl">
          <p className="text-xs font-semibold text-slate-700">経験した技術</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {work.technologies.slice(0, 4).map((technology) => (
              <span
                key={technology}
                className="rounded-full bg-teal-50 px-2.5 py-1 text-xs font-medium text-teal-800"
              >
                {technology}
              </span>
            ))}
          </div>
        </div>
        <div className="text-right">
          <Link
            href={`/works/${work.slug}`}
            className="mt-6 inline-flex w-fit items-center text-sm font-semibold text-teal-700 transition hover:text-teal-500"
          >
            詳細を見る&nbsp; →
          </Link>
        </div>
      </div>
    </article>
  );
}

export function PostCard({ post }: { post: Post }) {
  return (
    <article className="rounded-3xl bg-teal-100 p-6 shadow-xs transition duration-300 sm:p-8">
      <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600">
        <Badge>{post.category}</Badge>
        <time dateTime={post.publishedAt}>
          {new Intl.DateTimeFormat("ja-JP", {
            year: "numeric",
            month: "long",
            day: "numeric",
          }).format(new Date(post.publishedAt))}
        </time>
      </div>
      <h3 className="mt-5 text-2xl font-bold leading-snug text-slate-950">
        {post.title}
      </h3>
      <p className="mt-3 text-base leading-7 text-slate-700">{post.excerpt}</p>
      <div className="text-right">
        <Link
          href={`/posts/${post.slug}`}
          className="mt-6 inline-flex w-fit items-center text-sm font-semibold text-teal-700 transition hover:text-teal-500"
        >
          記事を読む&nbsp; →
        </Link>
      </div>
    </article>
  );
}

export function DetailHeader({
  eyebrow,
  title,
  summary,
}: {
  eyebrow: string;
  title: string;
  summary: string;
}) {
  return (
    <section className="border-b border-stone-200 bg-white">
      <div className="mx-auto w-full max-w-4xl px-5 py-14 sm:px-8 sm:py-20">
        <p className="text-sm font-semibold uppercase text-[#a9422f]">
          {eyebrow}
        </p>
        <h1 className="mt-4 text-4xl font-semibold leading-tight text-[#15231f] sm:text-6xl">
          {title}
        </h1>
        <p className="mt-6 text-lg leading-8 text-stone-700">{summary}</p>
      </div>
    </section>
  );
}
