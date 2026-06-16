import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DetailHeader } from "@/components/content-cards";
import { Badge, Section } from "@/components/site-shell";
import { getPublishedWorks, getWorkBySlug } from "@/lib/content";

type Props = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return getPublishedWorks().map((work) => ({ slug: work.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const work = getWorkBySlug(slug);

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
  const work = getWorkBySlug(slug);

  if (!work) {
    notFound();
  }

  return (
    <>
      <DetailHeader
        eyebrow={work.category}
        title={work.title}
        summary={work.summary}
      />
      <Section title="プロジェクト概要">
        <div className="grid gap-8 lg:grid-cols-[1fr_18rem]">
          <article className="prose-block">{work.body}</article>
          <aside className="h-fit rounded-lg border border-stone-200 bg-white p-6">
            <dl className="grid gap-5">
              <div>
                <dt className="text-sm font-semibold text-stone-500">
                  担当範囲
                </dt>
                <dd className="mt-1 text-[#15231f]">{work.role}</dd>
              </div>
              <div>
                <dt className="text-sm font-semibold text-stone-500">
                  使用技術
                </dt>
                <dd className="mt-2 flex flex-wrap gap-2">
                  {work.technologies.map((technology) => (
                    <Badge key={technology}>{technology}</Badge>
                  ))}
                </dd>
              </div>
            </dl>
          </aside>
        </div>
      </Section>
    </>
  );
}
