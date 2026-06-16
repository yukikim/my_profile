import type { CollectionConfig } from "payload";
import { isAdmin } from "@/access/isAdmin";

export const Users: CollectionConfig = {
  slug: "users",
  auth: true,
  admin: {
    useAsTitle: "email",
  },
  access: {
    create: isAdmin,
    delete: isAdmin,
    read: ({ req: { user } }) => Boolean(user),
    update: ({ req: { user } }) => user?.role === "admin",
  },
  fields: [
    {
      name: "name",
      type: "text",
      required: true,
    },
    {
      name: "role",
      type: "select",
      required: true,
      defaultValue: "admin",
      options: [
        { label: "Admin", value: "admin" },
        { label: "Editor", value: "editor" },
        { label: "Author", value: "author" },
      ],
    },
    {
      name: "lastLogin",
      type: "date",
      admin: {
        readOnly: true,
      },
    },
  ],
};
