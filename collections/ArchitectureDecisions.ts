import type { CollectionConfig } from "payload";
import { isAdminEditorOrAuthor } from "../access/isAdminEditorOrAuthor";
import { isAdminOrEditor } from "../access/isAdminOrEditor";
import { readPublishedEngineeringNote } from "../access/readPublishedEngineeringNote";

/**
 * ADR（Architecture Decision Record）を管理するCollectionです。
 * 結論だけでなく、背景、比較した選択肢、理由、トレードオフを残すことで、
 * 将来の開発者やMCPが「なぜその設計なのか」を再確認できるようにします。
 */
export const ArchitectureDecisions: CollectionConfig = {
  slug: "architecture-decisions",
  admin: {
    useAsTitle: "title",
    defaultColumns: [
      "decisionId",
      "title",
      "decisionStatus",
      "status",
      "visibility",
      "updatedAt",
    ],
    description:
      "設計上の背景、候補、採用方針、理由、トレードオフをADRとして記録します。",
  },
  // 設計判断の変更履歴そのものにも意味があるため、versionとdraftを保存します。
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
      name: "decisionId",
      type: "text",
      required: true,
      unique: true,
      index: true,
      admin: {
        description: "ADRを長期的に識別するIDです。例: ADR-0001",
      },
    },
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
          "公開URLやMCPの識別に使う一意な値です。例: choose-postgresql",
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
          "MCPでプロジェクト単位に設計判断を検索するための名前です。",
      },
    },
    {
      name: "decisionStatus",
      type: "select",
      required: true,
      defaultValue: "proposed",
      index: true,
      options: [
        { label: "Proposed", value: "proposed" },
        { label: "Accepted", value: "accepted" },
        { label: "Superseded", value: "superseded" },
      ],
      admin: {
        description:
          "ADRの検討状態です。下のstatus（公開状態）とは別の役割を持ちます。",
      },
    },
    {
      name: "context",
      type: "textarea",
      required: true,
      admin: {
        description: "判断が必要になった背景、課題、制約を記録します。",
      },
    },
    {
      name: "options",
      type: "array",
      required: true,
      minRows: 1,
      admin: {
        description: "比較検討した候補と、それぞれの長所・短所です。",
      },
      fields: [
        {
          name: "name",
          type: "text",
          required: true,
        },
        {
          name: "description",
          type: "textarea",
        },
        {
          name: "pros",
          type: "array",
          fields: [
            {
              name: "item",
              type: "text",
              required: true,
            },
          ],
        },
        {
          name: "cons",
          type: "array",
          fields: [
            {
              name: "item",
              type: "text",
              required: true,
            },
          ],
        },
      ],
    },
    {
      name: "decision",
      type: "textarea",
      required: true,
      admin: {
        description: "最終的に採用した方針を記録します。",
      },
    },
    {
      name: "rationale",
      type: "textarea",
      required: true,
      admin: {
        description: "他の候補ではなく、この方針を採用した理由です。",
      },
    },
    {
      name: "positiveConsequences",
      type: "array",
      admin: {
        description: "この判断によって得られる利点や期待効果です。",
      },
      fields: [
        {
          name: "item",
          type: "text",
          required: true,
        },
      ],
    },
    {
      name: "negativeConsequences",
      type: "array",
      admin: {
        description: "受け入れる必要があるデメリット、制約、将来コストです。",
      },
      fields: [
        {
          name: "item",
          type: "text",
          required: true,
        },
      ],
    },
    {
      name: "decidedAt",
      type: "date",
      index: true,
      admin: {
        description: "この方針を採用した日付です。",
      },
    },
    {
      name: "supersedes",
      type: "relationship",
      relationTo: "architecture-decisions",
      admin: {
        description:
          "このADRが置き換える古いADRです。履歴を削除せず判断の変化を残します。",
      },
    },
    {
      name: "relatedWorks",
      type: "relationship",
      relationTo: "works",
      hasMany: true,
      admin: {
        description: "この設計判断に関係するプロフィールサイト上の実績です。",
      },
    },
    {
      name: "relatedLogs",
      type: "relationship",
      relationTo: "development-logs",
      hasMany: true,
      admin: {
        description: "この設計判断に関係する開発日誌です。",
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
          "コンテンツの公開状態です。decisionStatusとは別に管理します。",
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
