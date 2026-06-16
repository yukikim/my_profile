import type { GlobalConfig } from "payload";
import { isAdminOrEditor } from "@/access/isAdminOrEditor";

export const Footer: GlobalConfig = {
  slug: "footer",
  access: {
    read: () => true,
    update: isAdminOrEditor,
  },
  fields: [
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
      name: "snsLinks",
      type: "array",
      fields: [
        {
          name: "label",
          type: "text",
          required: true,
        },
        {
          name: "url",
          type: "text",
          required: true,
        },
      ],
    },
    {
      name: "copyright",
      type: "text",
    },
  ],
};
