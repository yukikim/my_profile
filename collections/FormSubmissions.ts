import type { CollectionConfig } from "payload";
import { isAdminOrEditor } from "../access/isAdminOrEditor";

export const FormSubmissions: CollectionConfig = {
  slug: "form-submissions",
  admin: {
    useAsTitle: "id",
    defaultColumns: ["form", "createdAt"],
  },
  access: {
    create: isAdminOrEditor,
    delete: isAdminOrEditor,
    read: isAdminOrEditor,
    update: isAdminOrEditor,
  },
  fields: [
    {
      name: "form",
      type: "relationship",
      relationTo: "forms",
      required: true,
    },
    {
      name: "data",
      type: "json",
      required: true,
    },
  ],
};
