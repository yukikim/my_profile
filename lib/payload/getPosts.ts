import { getPublishedPosts } from "@/lib/content";
import { getPayloadClient } from "@/lib/payload/client";
import { mapPost } from "@/lib/payload/transform";

export async function getPosts() {
  const payload = await getPayloadClient();

  if (!payload) {
    return getPublishedPosts();
  }

  const result = await payload.find({
    collection: "posts",
    depth: 2,
    draft: false,
    limit: 100,
    sort: "-publishedAt",
    where: {
      and: [
        {
          status: {
            equals: "published",
          },
        },
        {
          or: [
            {
              publishedAt: {
                exists: false,
              },
            },
            {
              publishedAt: {
                less_than_equal: new Date().toISOString(),
              },
            },
          ],
        },
      ],
    },
  });

  const posts = result.docs.map(mapPost).filter((post) => post !== null);

  return posts.length ? posts : getPublishedPosts();
}

export function getFallbackPosts() {
  return getPublishedPosts();
}
