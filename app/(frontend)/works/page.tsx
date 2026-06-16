import type { Metadata } from "next";
import { WorkCard } from "@/components/content-cards";
import { PageIntro, Section } from "@/components/site-shell";
import { getPublishedWorks } from "@/lib/content";

export const metadata: Metadata = {
  title: "Works",
  description: "制作実績、プロジェクト、ポートフォリオの一覧。",
};

export default function WorksPage() {
  const works = getPublishedWorks();

  return (
    <>
      <PageIntro
        eyebrow="Works"
        title="制作実績とプロジェクト"
        description="CMS設計、フロントエンド実装、コンテンツ運用の観点から、公開後も育てやすいWebサイトを作ります。"
      />
      <Section title="実績一覧">
        <div className="grid gap-6 md:grid-cols-2">
          {works.map((work) => (
            <WorkCard key={work.slug} work={work} />
          ))}
        </div>
      </Section>
    </>
  );
}
