import type { Block } from "payload";

export const FAQ: Block = {
  slug: "faq",
  labels: {
    singular: "FAQ",
    plural: "FAQ Blocks",
  },
  fields: [
    {
      name: "items",
      type: "array",
      required: true,
      fields: [
        {
          name: "question",
          type: "text",
          required: true,
        },
        {
          name: "answer",
          type: "textarea",
          required: true,
        },
      ],
    },
  ],
};
