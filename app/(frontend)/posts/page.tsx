import type { Metadata } from "next";
import { PostCard } from "@/components/content-cards";
import { PageIntro, Section } from "@/components/site-shell";
import { getPublishedPosts } from "@/lib/content";

export const metadata: Metadata = {
  title: "Posts",
  description: "ブログ、ニュース、活動報告の記事一覧。",
};

export default function PostsPage() {
  const posts = getPublishedPosts();

  return (
    <>
      <PageIntro
        eyebrow="Posts"
        title="ブログと活動報告"
        description="CMS、フロントエンド、コンテンツ運用に関する考え方や実装メモを公開します。"
      />
      <Section title="記事一覧">
        <div className="grid gap-6 md:grid-cols-2">
          {posts.map((post) => (
            <PostCard key={post.slug} post={post} />
          ))}
        </div>
      </Section>
    </>
  );
}
