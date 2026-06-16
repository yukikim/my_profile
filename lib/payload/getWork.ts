import { getWorkBySlug } from "@/lib/content";

export async function getWork(slug: string) {
  return getWorkBySlug(slug);
}
