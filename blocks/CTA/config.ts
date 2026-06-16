import type { Block } from "payload";

export const CTA: Block = {
  slug: "cta",
  labels: {
    singular: "CTA",
    plural: "CTA Blocks",
  },
  fields: [
    {
      name: "title",
      type: "text",
      required: true,
    },
    {
      name: "description",
      type: "textarea",
      required: true,
    },
    {
      name: "buttonText",
      type: "text",
      required: true,
    },
    {
      name: "buttonUrl",
      type: "text",
      required: true,
    },
  ],
};
