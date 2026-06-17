import { profile } from "@/lib/content";
import { getPayloadClient } from "@/lib/payload/client";
import { mapProfile } from "@/lib/payload/transform";

export async function getProfile() {
  const payload = await getPayloadClient();

  if (!payload) {
    return profile;
  }

  const doc = await payload.findGlobal({
    slug: "profile",
    depth: 1,
  });

  return mapProfile(doc, profile);
}

export async function getFallbackProfile() {
  return profile;
}
