import Link from "next/link";
import type { Post, Work } from "@/lib/content";
import { Badge } from "@/components/site-shell";

export function WorkCard({ work }: { work: Work }) {
  return (
    <article className="grid min-h-72 overflow-hidden rounded-lg border border-stone-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="h-3 bg-[#2f6f73]" />
      <div className="flex h-full flex-col p-6">
        <div className="flex flex-wrap items-center gap-2">
          <Badge>{work.category}</Badge>
          <span className="text-sm text-stone-500">{work.role}</span>
        </div>
        <h3 className="mt-5 text-2xl font-semibold leading-snug text-[#15231f]">
          {work.title}
        </h3>
        <p className="mt-3 flex-1 text-base leading-7 text-stone-700">
          {work.summary}
        </p>
        <div className="mt-6 flex flex-wrap gap-2">
          {work.technologies.slice(0, 4).map((technology) => (
            <span
              key={technology}
              className="rounded-md bg-[#eef2ec] px-2.5 py-1 text-xs font-medium text-[#27443d]"
            >
              {technology}
            </span>
          ))}
        </div>
        <Link
          href={`/works/${work.slug}`}
          className="mt-6 inline-flex w-fit items-center rounded-md bg-[#15231f] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#284139]"
        >
          詳細を見る
        </Link>
      </div>
    </article>
  );
}

export function PostCard({ post }: { post: Post }) {
  return (
    <article className="rounded-lg border border-stone-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex flex-wrap items-center gap-3 text-sm text-stone-500">
        <Badge>{post.category}</Badge>
        <time dateTime={post.publishedAt}>
          {new Intl.DateTimeFormat("ja-JP", {
            year: "numeric",
            month: "long",
            day: "numeric",
          }).format(new Date(post.publishedAt))}
        </time>
      </div>
      <h3 className="mt-5 text-2xl font-semibold leading-snug text-[#15231f]">
        {post.title}
      </h3>
      <p className="mt-3 text-base leading-7 text-stone-700">{post.excerpt}</p>
      <Link
        href={`/posts/${post.slug}`}
        className="mt-6 inline-flex w-fit items-center rounded-md border border-[#15231f] px-4 py-2 text-sm font-semibold text-[#15231f] transition hover:bg-[#15231f] hover:text-white"
      >
        記事を読む
      </Link>
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
