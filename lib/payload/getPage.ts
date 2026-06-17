import { getPageBySlug, getPublishedPages } from "@/lib/content";
import { getPayloadClient } from "@/lib/payload/client";
import { mapPage } from "@/lib/payload/transform";

export async function getPage(slug: string) {
  const payload = await getPayloadClient();

  if (!payload) {
    return getPageBySlug(slug);
  }

  const result = await payload.find({
    collection: "pages",
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

  const page = await mapPage(result.docs[0]);

  return page || getPageBySlug(slug);
}

export function getFallbackPage(slug: string) {
  return getPageBySlug(slug);
}

export async function getPages() {
  const payload = await getPayloadClient();

  if (!payload) {
    return getPublishedPages();
  }

  const result = await payload.find({
    collection: "pages",
    depth: 1,
    draft: false,
    limit: 100,
    sort: "slug",
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

  const pages = (await Promise.all(result.docs.map(mapPage))).filter(
    (page) => page !== null,
  );

  return pages.length ? pages : getPublishedPages();
}

export function getFallbackPages() {
  return getPublishedPages();
}
