import { z } from "zod";

/** MCPとQuery Serviceの双方で守る取得件数上限です。大量取得を二重に防ぎます。 */
export const MCP_RESULT_LIMIT = 50;

/** Date.parseで解釈できるISO 8601日付・日時だけを受け入れます。 */
export const isoDateInputSchema = z
  .string()
  .trim()
  .min(1)
  .refine((value) => !Number.isNaN(Date.parse(value)), {
    message: "ISO 8601形式の日付を指定してください。",
  });

const optionalTextSchema = z.string().trim().min(1).optional();
const visibilitySchema = z.enum(["public", "private", "all"]).default("all");
const limitSchema = z.number().int().min(1).max(MCP_RESULT_LIMIT).default(10);
const tagsSchema = z.array(z.string().trim().min(1)).max(20).optional();

/** 開発日誌のキーワード検索入力です。 */
export const searchDevelopmentLogsInputSchema = z.object({
  query: optionalTextSchema,
  project: optionalTextSchema,
  tags: tagsSchema,
  from: isoDateInputSchema.optional(),
  to: isoDateInputSchema.optional(),
  relatedWorkSlug: optionalTextSchema,
  visibility: visibilitySchema,
  limit: limitSchema,
});

/** 直近の日誌を検索する期間と件数です。daysにも上限を設け、意図しない全期間検索を防ぎます。 */
export const recentDevelopmentLogsInputSchema = z.object({
  project: optionalTextSchema,
  days: z.number().int().min(1).max(3650).default(30),
  limit: limitSchema,
});

/** ADRのキーワード・状態検索入力です。 */
export const searchArchitectureDecisionsInputSchema = z.object({
  query: optionalTextSchema,
  project: optionalTextSchema,
  decisionStatus: z.enum(["proposed", "accepted", "superseded"]).optional(),
  tags: tagsSchema,
  relatedWorkSlug: optionalTextSchema,
  visibility: visibilitySchema,
  limit: limitSchema,
});

/** 日誌とADRを統合したプロジェクト履歴の入力です。 */
export const projectHistoryInputSchema = z
  .object({
    project: z.string().trim().min(1),
    from: isoDateInputSchema.optional(),
    to: isoDateInputSchema.optional(),
    includeLogs: z.boolean().default(true),
    includeDecisions: z.boolean().default(true),
    limit: limitSchema,
  })
  .refine((input) => input.includeLogs || input.includeDecisions, {
    message:
      "includeLogsまたはincludeDecisionsの少なくとも一方をtrueにしてください。",
  });

/** ADRの一意な識別子はdecisionIdかslugのどちらか一方だけを許可します。 */
export const decisionContextInputSchema = z
  .object({
    decisionId: optionalTextSchema,
    slug: optionalTextSchema,
  })
  .refine((input) => Boolean(input.decisionId) !== Boolean(input.slug), {
    message: "decisionIdまたはslugのどちらか一方を指定してください。",
  });

/** 関連ADRは起点となるdecisionIdかWork slugのどちらか一方だけを受け取ります。 */
export const relatedDecisionsInputSchema = z
  .object({
    decisionId: optionalTextSchema,
    workSlug: optionalTextSchema,
    includeSuperseded: z.boolean().default(false),
    limit: limitSchema,
  })
  .refine((input) => Boolean(input.decisionId) !== Boolean(input.workSlug), {
    message: "decisionIdまたはworkSlugのどちらか一方を指定してください。",
  });

const relatedWorkSchema = z.object({ title: z.string(), slug: z.string() });

/** Payload Documentからallowlist変換された開発日誌の構造化出力です。 */
export const developmentLogResultSchema = z.object({
  id: z.string(),
  title: z.string(),
  slug: z.string(),
  logDate: z.string(),
  project: z.string(),
  summary: z.string(),
  implementation: z.string().optional(),
  problem: z.string().optional(),
  cause: z.string().optional(),
  resolution: z.string().optional(),
  lessonsLearned: z.string().optional(),
  nextActions: z.array(z.string()),
  relatedWorks: z.array(relatedWorkSchema),
  relatedDecisionIds: z.array(z.string()),
  tags: z.array(z.string()),
  visibility: z.enum(["public", "private"]),
});

const architectureDecisionOptionSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  pros: z.array(z.string()),
  cons: z.array(z.string()),
});

/** Payload内部情報を除外したADRの構造化出力です。 */
export const architectureDecisionResultSchema = z.object({
  id: z.string(),
  decisionId: z.string(),
  title: z.string(),
  slug: z.string(),
  project: z.string(),
  context: z.string(),
  decision: z.string(),
  rationale: z.string(),
  options: z.array(architectureDecisionOptionSchema),
  positiveConsequences: z.array(z.string()),
  negativeConsequences: z.array(z.string()),
  decisionStatus: z.enum(["proposed", "accepted", "superseded"]),
  decidedAt: z.string().optional(),
  supersedesDecisionId: z.string().optional(),
  relatedWorks: z.array(relatedWorkSchema),
  relatedLogSlugs: z.array(z.string()),
  tags: z.array(z.string()),
  visibility: z.enum(["public", "private"]),
});

export const developmentLogListOutputSchema = z.object({
  items: z.array(developmentLogResultSchema),
  count: z.number().int().nonnegative(),
  query: z.record(z.string(), z.unknown()),
});

export const architectureDecisionListOutputSchema = z.object({
  items: z.array(architectureDecisionResultSchema),
  count: z.number().int().nonnegative(),
  query: z.record(z.string(), z.unknown()),
});

export const projectHistoryOutputSchema = z.object({
  items: z.array(
    z.discriminatedUnion("type", [
      z.object({
        type: z.literal("development-log"),
        date: z.string(),
        developmentLog: developmentLogResultSchema,
      }),
      z.object({
        type: z.literal("architecture-decision"),
        date: z.string().nullable(),
        architectureDecision: architectureDecisionResultSchema,
      }),
    ]),
  ),
  count: z.number().int().nonnegative(),
  query: z.record(z.string(), z.unknown()),
});

export const decisionContextOutputSchema = z.object({
  decision: architectureDecisionResultSchema,
  relatedLogs: z.array(developmentLogResultSchema),
});
