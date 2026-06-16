import type { Block } from "payload";

export const Hero: Block = {
  slug: "hero",
  labels: {
    singular: "Hero",
    plural: "Hero Blocks",
  },
  fields: [
    {
      name: "title",
      type: "text",
      required: true,
    },
    {
      name: "subtitle",
      type: "textarea",
    },
    {
      name: "backgroundImage",
      type: "relationship",
      relationTo: "media",
    },
    {
      name: "ctaText",
      type: "text",
    },
    {
      name: "ctaUrl",
      type: "text",
    },
  ],
};
