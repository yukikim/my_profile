import type { GlobalConfig } from "payload";
import { isAdminOrEditor } from "@/access/isAdminOrEditor";

export const Header: GlobalConfig = {
  slug: "header",
  access: {
    read: () => true,
    update: isAdminOrEditor,
  },
  fields: [
    {
      name: "logo",
      type: "relationship",
      relationTo: "media",
    },
    {
      name: "navigation",
      type: "array",
      fields: [
        {
          name: "label",
          type: "text",
          required: true,
        },
        {
          name: "href",
          type: "text",
          required: true,
        },
      ],
    },
    {
      name: "ctaButton",
      type: "group",
      fields: [
        {
          name: "label",
          type: "text",
        },
        {
          name: "href",
          type: "text",
        },
      ],
    },
  ],
};
