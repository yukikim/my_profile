import type { CollectionConfig } from "payload";
import { isAdminOrEditor } from "@/access/isAdminOrEditor";
import { seoField } from "@/fields/seo";

export const Works: CollectionConfig = {
  slug: "works",
  admin: {
    useAsTitle: "title",
    defaultColumns: ["title", "status", "publishedAt", "updatedAt"],
  },
  versions: {
    drafts: true,
  },
  access: {
    create: isAdminOrEditor,
    delete: isAdminOrEditor,
    read: () => true,
    update: isAdminOrEditor,
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
      name: "startDate",
      type: "date",
      required: true,
    },
    {
      name: "endDate",
      type: "date", 
      required: true,
    },
    {
      name: "excerpt",
      type: "textarea",
    },
    {
      name: "content",
      type: "richText",
    },
    {
      name: "thumbnail",
      type: "relationship",
      relationTo: "media",
    },
    {
      name: "gallery",
      type: "relationship",
      relationTo: "media",
      hasMany: true,
    },
    {
      name: "role",
      type: "text",
    },
    {
      name: "featured",
      type: "checkbox",
      defaultValue: false,
      admin: {
        description: "トップページの主要実績として表示します。",
      },
    },
    {
      name: "techStack",
      type: "array",
      fields: [
        {
          name: "technology",
          type: "text",
          required: true,
        },
      ],
    },
    {
      name: "projectUrl",
      type: "text",
    },
    {
      name: "repositoryUrl",
      type: "text",
    },
    {
      name: "categories",
      type: "relationship",
      relationTo: "categories",
      hasMany: true,
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
    seoField,
    {
      name: "publishedAt",
      type: "date",
    },
  ],
};
