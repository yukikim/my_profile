import type { GlobalConfig } from "payload";
import { isAdminOrEditor } from "../access/isAdminOrEditor";

export const Profile: GlobalConfig = {
  slug: "profile",
  access: {
    read: () => true,
    update: isAdminOrEditor,
  },
  fields: [
    {
      name: "name",
      type: "text",
      required: true,
    },
    {
      name: "title",
      type: "text",
    },
    {
      name: "bio",
      type: "richText",
      required: true,
    },
    {
      name: "avatar",
      type: "relationship",
      relationTo: "media",
    },
    {
      name: "skills",
      type: "array",
      fields: [
        {
          name: "skill",
          type: "text",
          required: true,
        },
      ],
    },
    {
      name: "careers",
      type: "array",
      fields: [
        {
          name: "period",
          type: "text",
          required: true,
        },
        {
          name: "title",
          type: "text",
          required: true,
        },
        {
          name: "description",
          type: "textarea",
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
  ],
};
