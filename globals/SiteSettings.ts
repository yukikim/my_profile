import type { GlobalConfig } from "payload";
import { isAdmin } from "../access/isAdmin";

export const SiteSettings: GlobalConfig = {
  slug: "site-settings",
  access: {
    read: () => true,
    update: isAdmin,
  },
  fields: [
    {
      name: "siteName",
      type: "text",
      required: true,
    },
    {
      name: "siteDescription",
      type: "textarea",
    },
    {
      name: "siteUrl",
      type: "text",
    },
    {
      name: "logo",
      type: "relationship",
      relationTo: "media",
    },
    {
      name: "favicon",
      type: "relationship",
      relationTo: "media",
    },
    {
      name: "defaultOgImage",
      type: "relationship",
      relationTo: "media",
    },
  ],
};
