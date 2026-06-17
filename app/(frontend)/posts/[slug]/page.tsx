import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DetailHeader } from "@/components/content-cards";
import { Section } from "@/components/site-shell";
import { getPost } from "@/lib/payload/getPost";
import { getPosts } from "@/lib/payload/getPosts";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  const posts = await getPosts();

  return posts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);

  if (!post) {
    return {
      title: "Post not found",
    };
  }

  return {
    title: post.title,
    description: post.excerpt,
  };
}

export default async function PostDetailPage({ params }: Props) {
  const { slug } = await params;
  const post = await getPost(slug);

  if (!post) {
    notFound();
  }

  return (
    <>
      <DetailHeader
        eyebrow={`${post.category} / ${new Intl.DateTimeFormat("ja-JP", {
          year: "numeric",
          month: "long",
          day: "numeric",
        }).format(new Date(post.publishedAt))}`}
        title={post.title}
        summary={post.excerpt}
      />
      <Section title="本文">
        <article className="prose-block">{post.body}</article>
      </Section>
    </>
  );
}
