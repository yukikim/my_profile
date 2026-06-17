import { getWorkBySlug } from "@/lib/content";
import { getPayloadClient } from "@/lib/payload/client";
import { mapWork } from "@/lib/payload/transform";

export async function getWork(slug: string) {
  const payload = await getPayloadClient();

  if (!payload) {
    return getWorkBySlug(slug);
  }

  const result = await payload.find({
    collection: "works",
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

  const work = mapWork(result.docs[0]);

  return work || getWorkBySlug(slug);
}

export function getFallbackWork(slug: string) {
  return getWorkBySlug(slug);
}
