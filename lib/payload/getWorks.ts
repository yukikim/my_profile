import { getPublishedWorks } from "@/lib/content";
import { getPayloadClient } from "@/lib/payload/client";
import { mapWork } from "@/lib/payload/transform";

export async function getWorks() {
  const payload = await getPayloadClient();

  if (!payload) {
    return getPublishedWorks();
  }

  const result = await payload.find({
    collection: "works",
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

  const works = result.docs.map(mapWork).filter((work) => work !== null);

  return works.length ? works : getPublishedWorks();
}

export async function getFeaturedWorks() {
  const works = await getWorks();

  return works.filter((work) => work.featured).slice(0, 2);
}

export function getFallbackWorks() {
  return getPublishedWorks();
}
