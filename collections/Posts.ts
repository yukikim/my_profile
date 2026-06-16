import type { CollectionConfig } from "payload";
import { isAdminEditorOrAuthor } from "@/access/isAdminEditorOrAuthor";
import { isAdminOrEditor } from "@/access/isAdminOrEditor";
import { seoField } from "@/fields/seo";

export const Posts: CollectionConfig = {
  slug: "posts",
  admin: {
    useAsTitle: "title",
    defaultColumns: ["title", "status", "publishedAt", "updatedAt"],
  },
  versions: {
    drafts: true,
  },
  access: {
    create: isAdminEditorOrAuthor,
    delete: isAdminOrEditor,
    read: () => true,
    update: isAdminEditorOrAuthor,
  },
  fields: [
    {
      name: "title",
      type: "text",
      required: true,
    },
    {
      name: "slug",
      type: "text",
      required: true,
      unique: true,
      index: true,
    },
    {
      name: "excerpt",
      type: "textarea",
    },
    {
      name: "content",
      type: "richText",
      required: true,
    },
    {
      name: "thumbnail",
      type: "relationship",
      relationTo: "media",
    },
    {
      name: "status",
      type: "select",
      required: true,
      defaultValue: "draft",
      options: [
        { label: "Draft", value: "draft" },
        { label: "Published", value: "published" },
      ],
    },
    {
      name: "publishedAt",
      type: "date",
    },
    {
      name: "author",
      type: "relationship",
      relationTo: "users",
    },
    {
      name: "categories",
      type: "relationship",
      relationTo: "categories",
      hasMany: true,
    },
    seoField,
  ],
};
