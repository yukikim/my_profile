import type { CollectionConfig } from "payload";
import { isAdminOrEditor } from "@/access/isAdminOrEditor";
import { CTA } from "@/blocks/CTA/config";
import { ContactForm } from "@/blocks/ContactForm/config";
import { FAQ } from "@/blocks/FAQ/config";
import { Features } from "@/blocks/Features/config";
import { Gallery } from "@/blocks/Gallery/config";
import { Hero } from "@/blocks/Hero/config";
import { RichText } from "@/blocks/RichText/config";
import { seoField } from "@/fields/seo";

export const Pages: CollectionConfig = {
  slug: "pages",
  admin: {
    useAsTitle: "title",
    defaultColumns: ["title", "slug", "status", "updatedAt"],
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
      name: "layout",
      type: "blocks",
      admin: {
        description:
          "公開ページに表示するブロックです。Hero、本文、ギャラリー、FAQ、CTA、フォームを追加し、ドラッグして並べ替えできます。",
      },
      blocks: [Hero, RichText, Features, Gallery, FAQ, CTA, ContactForm],
      minRows: 1,
    },
    seoField,
    {
      name: "publishedAt",
      type: "date",
    },
  ],
};
