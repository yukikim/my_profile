import type { CollectionConfig } from "payload";
import { isAdminEditorOrAuthor } from "../access/isAdminEditorOrAuthor";
import { isAdminOrEditor } from "../access/isAdminOrEditor";
import { readPublishedEngineeringNote } from "../access/readPublishedEngineeringNote";

/**
 * 実装内容、問題、原因、解決方法、学びを構造化して保存するCollectionです。
 * 文章を単純な記事として持つのではなく項目別に保存することで、将来のMCPが
 * 「原因だけ」「次の作業だけ」のように必要な情報を安全に取り出せます。
 */
export const DevelopmentLogs: CollectionConfig = {
  slug: "development-logs",
  admin: {
    useAsTitle: "title",
    defaultColumns: [
      "title",
      "project",
      "logDate",
      "status",
      "visibility",
      "updatedAt",
    ],
    description:
      "日々の実装内容、問題、原因、解決方法、学び、次の作業を記録します。",
  },
  // Payloadのversionsを有効にすると、変更履歴の確認と下書き保存ができます。
  versions: {
    drafts: true,
  },
  access: {
    create: isAdminEditorOrAuthor,
    delete: isAdminOrEditor,
    read: readPublishedEngineeringNote,
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
      admin: {
        description:
          "公開URLやMCPの識別に使う一意な値です。例: contact-form-implementation",
      },
    },
    {
      name: "logDate",
      type: "date",
      required: true,
      admin: {
        description: "この作業を行った日付です。",
      },
    },
    {
      name: "project",
      type: "text",
      required: true,
      defaultValue: "my_profile",
      index: true,
      admin: {
        description:
          "MCPでプロジェクト単位に履歴を検索するための名前です。",
      },
    },
    {
      name: "summary",
      type: "textarea",
      required: true,
      admin: {
        description: "この日誌で行った作業の短い概要です。",
      },
    },
    {
      name: "implementation",
      type: "textarea",
      admin: {
        description: "実装・変更した内容を記録します。",
      },
    },
    {
      name: "problem",
      type: "textarea",
      admin: {
        description: "発生した現象やエラーメッセージを記録します。",
      },
    },
    {
      name: "cause",
      type: "textarea",
      admin: {
        description: "調査によって判明した根本原因を記録します。",
      },
    },
    {
      name: "resolution",
      type: "textarea",
      admin: {
        description: "実施した対処と、解決を確認した方法を記録します。",
      },
    },
    {
      name: "lessonsLearned",
      type: "textarea",
      admin: {
        description: "学んだことや、同じ問題を防ぐための知識を記録します。",
      },
    },
    {
      name: "nextActions",
      type: "array",
      admin: {
        description: "この記録から引き継ぐ次の作業です。",
      },
      fields: [
        {
          name: "task",
          type: "text",
          required: true,
        },
      ],
    },
    {
      name: "relatedWorks",
      type: "relationship",
      relationTo: "works",
      hasMany: true,
      admin: {
        description: "この日誌に関係するプロフィールサイト上の実績です。",
      },
    },
    {
      name: "relatedDecisions",
      type: "relationship",
      relationTo: "architecture-decisions",
      hasMany: true,
      admin: {
        description: "この作業に関係する設計判断（ADR）です。",
      },
    },
    {
      name: "tags",
      type: "array",
      admin: {
        description: "MCP検索の絞り込みに使うキーワードです。",
      },
      fields: [
        {
          name: "label",
          type: "text",
          required: true,
        },
      ],
    },
    {
      name: "status",
      type: "select",
      required: true,
      defaultValue: "draft",
      index: true,
      options: [
        { label: "Draft", value: "draft" },
        { label: "Published", value: "published" },
      ],
      admin: {
        description:
          "コンテンツの公開状態です。Payload上の下書き保存と合わせて確認します。",
      },
    },
    {
      name: "visibility",
      type: "select",
      required: true,
      defaultValue: "private",
      index: true,
      options: [
        { label: "Public", value: "public" },
        { label: "Private", value: "private" },
      ],
      admin: {
        description:
          "Publicは公開サイトにも表示し、Privateは将来の信頼済みMCPだけで利用します。",
      },
    },
    {
      name: "publishedAt",
      type: "date",
      index: true,
      admin: {
        description:
          "未設定ならすぐ公開できます。未来日時の場合は、その日時まで外部へ公開しません。",
      },
    },
  ],
};
