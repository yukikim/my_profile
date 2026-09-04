import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { DetailHeader } from "@/components/content-cards";
import { Badge, Section } from "@/components/site-shell";
import { getWork } from "@/lib/payload/getWork";
import { getWorks } from "@/lib/payload/getWorks";
import {
  formatApproximateMonthDuration,
  formatSlashDate,
} from "@/lib/formatDate";
import { ScrollingBackgroundOrbsSub } from "@/components/scrolling-background-orbs-sub";
import { Breadcrumbs } from "@/components/breadcrumbs";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  const works = await getWorks();

  return works.map((work) => ({ slug: work.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const work = await getWork(slug);

  if (!work) {
    return {
      title: "Work not found",
    };
  }

  return {
    title: work.title,
    description: work.summary,
  };
}

export default async function WorkDetailPage({ params }: Props) {
  const { slug } = await params;
  const work = await getWork(slug);

  if (!work) {
    notFound();
  }

  return (
    <>
      <ScrollingBackgroundOrbsSub />
      <Breadcrumbs
        items={[{ label: "Works", href: "/works" }, { label: work.title }]}
      />
      <DetailHeader
        eyebrow={work.category}
        title={work.title}
        summary={work.summary}
      />
      {work.thumbnail?.src ? (
        <div className="mx-auto mt-8 max-w-5xl px-5 sm:px-8">
          <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-stone-200 bg-stone-100 shadow-sm">
            <Image
              src={work.thumbnail.src}
              alt={work.thumbnail.alt || work.title}
              fill
              sizes="(max-width: 1024px) 100vw, 1024px"
              className="object-cover"
              priority
            />
          </div>
        </div>
      ) : null}
      <Section title="業務概要">
        <div className="grid gap-8 lg:grid-cols-[1fr_18rem]">
          {work.bodyHtml ? (
            <article
              className="rich-text"
              dangerouslySetInnerHTML={{ __html: work.bodyHtml }}
            />
          ) : (
            <article className="prose-block">{work.body}</article>
          )}
          <aside className="h-fit rounded-lg border border-stone-200 bg-white p-6">
            <div className="mb-4 border-b border-stone-300">
              <p className="text-base font-semibold text-stone-500">
                期間: {formatSlashDate(work.startDate)} -{" "}
                {formatSlashDate(work.endDate)}
              </p>
              <p className="text-right text-xs">
                ({formatApproximateMonthDuration(work.startDate, work.endDate)})
              </p>
            </div>
            <dl className="grid gap-5">
              <div className="border-b border-stone-300">
                <dt className="text-sm font-semibold text-stone-500">
                  【就業形態】
                </dt>
                <dd className="mt-1 text-[#15231f] text-right">{work.role}</dd>
              </div>
              <div>
                <dt className="text-sm font-semibold text-stone-500">
                  【経験技術】
                </dt>
                <dd className="mt-2 flex flex-wrap gap-2">
                  {work.technologies.map((technology) => (
                    <Badge key={technology}>{technology}</Badge>
                  ))}
                </dd>
              </div>
              {work.url || work.githubUrl ? (
                <div>
                  <dt className="text-sm font-semibold text-stone-500">
                    関連リンク
                  </dt>
                  <dd className="mt-2 grid gap-2">
                    {work.url ? (
                      <a
                        href={work.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sm font-semibold text-[#2f6f73] underline"
                      >
                        公開サイト
                      </a>
                    ) : null}
                    {work.githubUrl ? (
                      <a
                        href={work.githubUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sm font-semibold text-[#2f6f73] underline"
                      >
                        GitHub
                      </a>
                    ) : null}
                  </dd>
                </div>
              ) : null}
            </dl>
          </aside>
        </div>
      </Section>
    </>
  );
}
