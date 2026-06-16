import type { Field } from "payload";

export const seoField: Field = {
  name: "seo",
  type: "group",
  fields: [
    {
      name: "metaTitle",
      type: "text",
      maxLength: 70,
    },
    {
      name: "metaDescription",
      type: "textarea",
      maxLength: 160,
    },
    {
      name: "ogImage",
      type: "relationship",
      relationTo: "media",
    },
    {
      name: "canonicalUrl",
      type: "text",
    },
  ],
};
