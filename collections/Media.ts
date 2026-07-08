import type { CollectionConfig } from "payload";
import { isAdminOrEditor } from "../access/isAdminOrEditor";

export const Media: CollectionConfig = {
  slug: "media",
  upload: {
    staticDir: "public/media",
    imageSizes: [
      {
        name: "thumbnail",
        width: 640,
        height: 480,
        position: "centre",
      },
      {
        name: "og",
        width: 1200,
        height: 630,
        position: "centre",
      },
    ],
  },
  admin: {
    useAsTitle: "alt",
  },
  access: {
    create: isAdminOrEditor,
    delete: isAdminOrEditor,
    read: () => true,
    update: isAdminOrEditor,
  },
  fields: [
    {
      name: "alt",
      type: "text",
      required: true,
    },
    {
      name: "caption",
      type: "text",
    },
  ],
};
