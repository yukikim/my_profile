import { getPublishedPosts } from "@/lib/content";

export async function getPosts() {
  return getPublishedPosts();
}
