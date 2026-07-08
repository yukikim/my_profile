import type { CollectionConfig } from "payload";
import { isAdminOrEditor } from "../access/isAdminOrEditor";

export const Forms: CollectionConfig = {
  slug: "forms",
  admin: {
    useAsTitle: "name",
  },
  access: {
    create: isAdminOrEditor,
    delete: isAdminOrEditor,
    read: ({ req: { user } }) => Boolean(user),
    update: isAdminOrEditor,
  },
  fields: [
    {
      name: "name",
      type: "text",
      required: true,
    },
    {
      name: "fields",
      type: "array",
      required: true,
      fields: [
        {
          name: "name",
          type: "text",
          required: true,
        },
        {
          name: "label",
          type: "text",
          required: true,
        },
        {
          name: "type",
          type: "select",
          required: true,
          defaultValue: "text",
          options: [
            { label: "Text", value: "text" },
            { label: "Email", value: "email" },
            { label: "Textarea", value: "textarea" },
          ],
        },
        {
          name: "required",
          type: "checkbox",
          defaultValue: false,
        },
      ],
    },
    {
      name: "successMessage",
      type: "textarea",
    },
    {
      name: "notificationEmails",
      type: "array",
      fields: [
        {
          name: "email",
          type: "email",
          required: true,
        },
      ],
    },
  ],
};
