import { profile, siteNavigation } from "@/lib/content";

export async function getFooter() {
  return {
    navigation: siteNavigation,
    snsLinks: profile.socials,
  };
}
