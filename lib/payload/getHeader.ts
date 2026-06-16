import { siteNavigation } from "@/lib/content";

export async function getHeader() {
  return {
    navigation: siteNavigation,
  };
}
