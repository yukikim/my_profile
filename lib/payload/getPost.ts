import { getPostBySlug } from "@/lib/content";
import { getPayloadClient } from "@/lib/payload/client";
import { mapPost } from "@/lib/payload/transform";

export async function getPost(slug: string) {
  const payload = await getPayloadClient();

  if (!payload) {
    return getPostBySlug(slug);
  }

  const result = await payload.find({
    collection: "posts",
    depth: 2,
    draft: false,
    limit: 1,
    where: {
      and: [
        {
          slug: {
            equals: slug,
          },
        },
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

  const post = mapPost(result.docs[0]);

  return post || getPostBySlug(slug);
}

export function getFallbackPost(slug: string) {
  return getPostBySlug(slug);
}
