import type { Block } from "payload";

export const Gallery: Block = {
  slug: "gallery",
  labels: {
    singular: "Gallery",
    plural: "Gallery Blocks",
  },
  fields: [
    {
      name: "images",
      type: "relationship",
      relationTo: "media",
      hasMany: true,
      required: true,
    },
  ],
};
