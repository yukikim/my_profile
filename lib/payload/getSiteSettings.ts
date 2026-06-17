import { profile } from "@/lib/content";
import { getPayloadClient } from "@/lib/payload/client";

export async function getSiteSettings() {
  const payload = await getPayloadClient();

  if (!payload) {
    return getFallbackSiteSettings();
  }

  const settings = await payload.findGlobal({
    slug: "site-settings",
    depth: 1,
  });

  return {
    siteDescription:
      typeof settings.siteDescription === "string"
        ? settings.siteDescription
        : getFallbackSiteSettings().siteDescription,
    siteName:
      typeof settings.siteName === "string"
        ? settings.siteName
        : getFallbackSiteSettings().siteName,
    siteUrl:
      typeof settings.siteUrl === "string"
        ? settings.siteUrl
        : getFallbackSiteSettings().siteUrl,
  };
}

function getFallbackSiteSettings() {
  return {
    siteDescription:
      "プロフィール、実績、記事、問い合わせをCMSで管理する個人プロフィールサイト。",
    siteName: profile.name,
    siteUrl: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
  };
}
