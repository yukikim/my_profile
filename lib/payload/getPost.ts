import { getPostBySlug } from "@/lib/content";

export async function getPost(slug: string) {
  return getPostBySlug(slug);
}
