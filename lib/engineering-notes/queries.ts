import type { Payload, Where } from "payload";
import { mapArchitectureDecision, mapDevelopmentLog } from "./mappers";
import type {
  ArchitectureDecisionQuery,
  ArchitectureDecisionResult,
  BaseEngineeringNoteQuery,
  DevelopmentLogQuery,
  DevelopmentLogResult,
  EngineeringNotesAudience,
} from "./types";
import {
  buildEngineeringNoteVisibilityWhere,
  normalizeEngineeringNotesLimit,
} from "./visibility";

/** 空文字を検索条件へ入れないため、文字列をtrimして正規化します。 */
function normalizeOptionalText(value?: string) {
  const normalized = value?.trim();
  return normalized ? normalized : undefined;
}

/** tag配列から空要素と重複を除き、同じ条件の重複生成を防ぎます。 */
function normalizeTags(tags?: string[]) {
  return [...new Set(tags?.map((tag) => tag.trim()).filter(Boolean) ?? [])];
}

/**
 * 日付条件をISO 8601へ正規化します。
 * 不正日付をDBエラーにせず、呼び出し元が理解できるRangeErrorとして早期に返します。
 */
function normalizeDate(value: string | undefined, fieldName: "from" | "to") {
  if (!value) {
    return undefined;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw new RangeError(`${fieldName} must be a valid date.`);
  }

  return date.toISOString();
}

/** project、tag、日付、関連Workに共通するWhere条件を追加します。 */
function appendCommonWhereConditions(
  conditions: Where[],
  input: BaseEngineeringNoteQuery,
  dateField: "decidedAt" | "logDate",
  relatedWorkId?: number,
) {
  const project = normalizeOptionalText(input.project);
  const tags = normalizeTags(input.tags);
  const from = normalizeDate(input.from, "from");
  const to = normalizeDate(input.to, "to");

  if (project) {
    conditions.push({ project: { equals: project } });
  }

  if (tags.length) {
    conditions.push({ "tags.label": { in: tags } });
  }

  if (from) {
    conditions.push({ [dateField]: { greater_than_equal: from } });
  }

  if (to) {
    conditions.push({ [dateField]: { less_than_equal: to } });
  }

  if (relatedWorkId !== undefined) {
    conditions.push({ relatedWorks: { equals: relatedWorkId } });
  }
}

/** 開発日誌用の必須条件と任意検索条件を1つのWhereへまとめます。 */
export function buildDevelopmentLogWhere(
  input: DevelopmentLogQuery,
  relatedWorkId?: number,
  now = new Date().toISOString(),
): Where {
  const conditions: Where[] = [
    buildEngineeringNoteVisibilityWhere(input.audience, input.visibility, now),
  ];
  const query = normalizeOptionalText(input.query);

  appendCommonWhereConditions(conditions, input, "logDate", relatedWorkId);

  if (query) {
    conditions.push({
      or: [
        { title: { contains: query } },
        { summary: { contains: query } },
        { implementation: { contains: query } },
        { problem: { contains: query } },
        { cause: { contains: query } },
        { resolution: { contains: query } },
        { lessonsLearned: { contains: query } },
      ],
    });
  }

  return { and: conditions };
}

/** ADR用の必須条件と任意検索条件を1つのWhereへまとめます。 */
export function buildArchitectureDecisionWhere(
  input: ArchitectureDecisionQuery,
  relatedWorkId?: number,
  now = new Date().toISOString(),
): Where {
  const conditions: Where[] = [
    buildEngineeringNoteVisibilityWhere(input.audience, input.visibility, now),
  ];
  const query = normalizeOptionalText(input.query);

  appendCommonWhereConditions(conditions, input, "decidedAt", relatedWorkId);

  if (input.decisionStatus) {
    conditions.push({
      decisionStatus: {
        equals: input.decisionStatus,
      },
    });
  }

  if (query) {
    conditions.push({
      or: [
        { decisionId: { contains: query } },
        // MCPではADRをslugでも1件特定するため、識別子を検索対象へ含めます。
        { slug: { contains: query } },
        { title: { contains: query } },
        { context: { contains: query } },
        { decision: { contains: query } },
        { rationale: { contains: query } },
      ],
    });
  }

  return { and: conditions };
}

/**
 * Work slugをrelationship検索に使えるDB IDへ解決します。
 * public-siteでは公開済みWorkだけを対象にし、非公開Workの存在を検索条件経由で漏らしません。
 */
async function resolveRelatedWorkId(
  payload: Payload,
  relatedWorkSlug: string | undefined,
  audience: EngineeringNotesAudience,
) {
  const slug = normalizeOptionalText(relatedWorkSlug);

  if (!slug) {
    return undefined;
  }

  const conditions: Where[] = [{ slug: { equals: slug } }];

  if (audience === "public-site") {
    conditions.push(
      { status: { equals: "published" } },
      { _status: { equals: "published" } },
    );
  }

  const result = await payload.find({
    collection: "works",
    depth: 0,
    draft: false,
    limit: 1,
    overrideAccess: audience === "trusted-mcp",
    where: { and: conditions },
  });

  return result.docs[0]?.id ?? null;
}

/** Payloadから開発日誌を検索し、安全な出力型へ変換します。 */
export async function queryDevelopmentLogs(
  payload: Payload,
  input: DevelopmentLogQuery,
): Promise<DevelopmentLogResult[]> {
  const relatedWorkId = await resolveRelatedWorkId(
    payload,
    input.relatedWorkSlug,
    input.audience,
  );

  if (relatedWorkId === null) {
    return [];
  }

  const result = await payload.find({
    collection: "development-logs",
    depth: 1,
    draft: false,
    limit: normalizeEngineeringNotesLimit(input.limit),
    overrideAccess: input.audience === "trusted-mcp",
    sort: "-logDate",
    where: buildDevelopmentLogWhere(input, relatedWorkId),
  });

  return result.docs.map(mapDevelopmentLog);
}

/** PayloadからADRを検索し、安全な出力型へ変換します。 */
export async function queryArchitectureDecisions(
  payload: Payload,
  input: ArchitectureDecisionQuery,
): Promise<ArchitectureDecisionResult[]> {
  const relatedWorkId = await resolveRelatedWorkId(
    payload,
    input.relatedWorkSlug,
    input.audience,
  );

  if (relatedWorkId === null) {
    return [];
  }

  const result = await payload.find({
    collection: "architecture-decisions",
    depth: 1,
    draft: false,
    limit: normalizeEngineeringNotesLimit(input.limit),
    overrideAccess: input.audience === "trusted-mcp",
    sort: "-decidedAt",
    where: buildArchitectureDecisionWhere(input, relatedWorkId),
  });

  return result.docs.map(mapArchitectureDecision);
}
