import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BlockRenderer } from "@/components/cms/BlockRenderer";
import { getPage, getPages } from "@/lib/payload/getPage";

type Props = {
  params: Promise<{
    slug: string[];
  }>;
};

export async function generateStaticParams() {
  const pages = await getPages();

  return pages.map((page) => ({
    slug: page.slug.split("/"),
  }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const page = await getPage(slug.join("/"));

  if (!page) {
    return {
      title: "Page not found",
    };
  }

  return {
    title: page.seo?.metaTitle || page.title,
    description: page.seo?.metaDescription,
  };
}

export default async function CmsPage({ params }: Props) {
  const { slug } = await params;
  const page = await getPage(slug.join("/"));

  if (!page) {
    notFound();
  }

  return <BlockRenderer blocks={page.layout} />;
}
