import type { Block } from "payload";

export const ContactForm: Block = {
  slug: "contactForm",
  labels: {
    singular: "Contact Form",
    plural: "Contact Form Blocks",
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
    },
    {
      name: "form",
      type: "relationship",
      relationTo: "forms",
      required: true,
    },
  ],
};
