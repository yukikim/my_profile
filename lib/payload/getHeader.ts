import { siteNavigation } from "@/lib/content";
import { getPayloadClient } from "@/lib/payload/client";
import { mapNavigation } from "@/lib/payload/transform";

export async function getHeader() {
  const payload = await getPayloadClient();

  if (!payload) {
    return {
      navigation: siteNavigation,
    };
  }

  const header = await payload.findGlobal({
    slug: "header",
    depth: 1,
  });
  const navigation = mapNavigation(header.navigation);
  const ctaButton =
    header.ctaButton &&
    typeof header.ctaButton === "object" &&
    "label" in header.ctaButton &&
    "href" in header.ctaButton &&
    typeof header.ctaButton.label === "string" &&
    typeof header.ctaButton.href === "string"
      ? {
          href: header.ctaButton.href,
          label: header.ctaButton.label,
        }
      : undefined;

  return {
    ctaButton,
    navigation: navigation.length ? navigation : siteNavigation,
  };
}
