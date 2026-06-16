import { getPageBySlug, getPublishedPages } from "@/lib/content";

export async function getPage(slug: string) {
  return getPageBySlug(slug);
}

export async function getPages() {
  return getPublishedPages();
}
