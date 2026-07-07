import type { Metadata } from "next";
import Link from "next/link";
import { WorkCard } from "@/components/content-cards";
import { PageIntro, Section } from "@/components/site-shell";
import { getWorks } from "@/lib/payload/getWorks";

export const metadata: Metadata = {
  title: "Works",
  description: "制作実績、プロジェクト、ポートフォリオの一覧。",
};

type Props = {
  searchParams: Promise<{
    category?: string;
  }>;
};

export default async function WorksPage({ searchParams }: Props) {
  const { category } = await searchParams;
  const works = await getWorks();
  const categories = Array.from(new Set(works.map((work) => work.category)));
  const filteredWorks = category
    ? works.filter((work) => work.category === category)
    : works;

  return (
    <>
      <PageIntro
        eyebrow="Works"
        title="Work History"
        description="CMS設計、フロントエンド実装、コンテンツ運用の観点から、公開後も育てやすいWebサイトを作ります。"
      />
      <Section title="職務経歴一覧">
        <div className="mb-8 flex flex-wrap gap-2">
          <Link
            href="/works"
            className={`rounded-md border px-3 py-2 text-sm font-semibold transition ${
              category
                ? "border-stone-300 bg-white text-stone-700 hover:bg-[#f8f5ef]"
                : "border-[#15231f] bg-[#15231f] text-white"
            }`}
          >
            All
          </Link>
          {categories.map((item) => (
            <Link
              key={item}
              href={`/works?category=${encodeURIComponent(item)}`}
              className={`rounded-md border px-3 py-2 text-sm font-semibold transition ${
                category === item
                  ? "border-[#15231f] bg-[#15231f] text-white"
                  : "border-stone-300 bg-white text-stone-700 hover:bg-[#f8f5ef]"
              }`}
            >
              {item}
            </Link>
          ))}
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          {filteredWorks.map((work) => (
            <WorkCard key={work.slug} work={work} />
          ))}
        </div>
      </Section>
    </>
  );
}
