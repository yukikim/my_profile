import type { Metadata } from "next";
import Link from "next/link";
import { PostCard } from "@/components/content-cards";
import { PageIntro, Section } from "@/components/site-shell";
import { getPosts } from "@/lib/payload/getPosts";

export const metadata: Metadata = {
  title: "Posts",
  description: "ブログ、ニュース、活動報告の記事一覧。",
};

type Props = {
  searchParams: Promise<{
    category?: string;
  }>;
};

export default async function PostsPage({ searchParams }: Props) {
  const { category } = await searchParams;
  const posts = await getPosts();
  const categories = Array.from(new Set(posts.map((post) => post.category)));
  const filteredPosts = category
    ? posts.filter((post) => post.category === category)
    : posts;

  return (
    <>
      <PageIntro
        eyebrow="Posts"
        title="ブログと活動報告"
        description="CMS、フロントエンド、コンテンツ運用に関する考え方や実装メモを公開します。"
      />
      <Section title="記事一覧">
        <div className="mb-8 flex flex-wrap gap-2">
          <Link
            href="/posts"
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
              href={`/posts?category=${encodeURIComponent(item)}`}
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
          {filteredPosts.map((post) => (
            <PostCard key={post.slug} post={post} />
          ))}
        </div>
      </Section>
    </>
  );
}
