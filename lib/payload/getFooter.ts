import { profile, siteNavigation } from "@/lib/content";
import { getPayloadClient } from "@/lib/payload/client";
import { mapNavigation, mapSnsLinks } from "@/lib/payload/transform";

export async function getFooter() {
  const payload = await getPayloadClient();

  if (!payload) {
    return {
      copyright: `© ${new Date().getFullYear()} ${profile.name}`,
      navigation: siteNavigation,
      snsLinks: profile.socials,
    };
  }

  const footer = await payload.findGlobal({
    slug: "footer",
    depth: 1,
  });
  const navigation = mapNavigation(footer.navigation);
  const snsLinks = mapSnsLinks(footer.snsLinks);

  return {
    copyright:
      typeof footer.copyright === "string"
        ? footer.copyright
        : `© ${new Date().getFullYear()} ${profile.name}`,
    navigation: navigation.length ? navigation : siteNavigation,
    snsLinks: snsLinks.length ? snsLinks : profile.socials,
  };
}
