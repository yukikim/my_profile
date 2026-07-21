import { z } from "zod";
import { isIso8601DateTime, normalizeUniqueStrings } from "./normalize";

/**
 * 1ファイル1Documentを前提にした入力上限です。
 * 巨大なログやコード全文を誤って読み込む前に、JSON文字列のbyte数で拒否します。
 */
export const ENGINEERING_NOTE_DRAFT_LIMITS = {
  fileBytes: 256 * 1024,
  identifierCharacters: 120,
  titleCharacters: 200,
  projectCharacters: 80,
  summaryCharacters: 1_000,
  bodyCharacters: 10_000,
  optionDescriptionCharacters: 4_000,
  arrayItemCharacters: 1_000,
  tagCharacters: 50,
  arrayItems: 20,
} as const;

const trimmedText = (max: number) => z.string().trim().min(1).max(max);

const slugSchema = trimmedText(
  ENGINEERING_NOTE_DRAFT_LIMITS.identifierCharacters,
).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "slug must use lowercase kebab-case.");

const decisionIdSchema = trimmedText(
  ENGINEERING_NOTE_DRAFT_LIMITS.identifierCharacters,
).regex(
  /^[A-Z0-9]+(?:-[A-Z0-9]+)*-ADR-\d{4}$/,
  "decisionId must use the PROJECT-ADR-0001 format.",
);

// relationshipは既存のADR-0001形式も参照するため、新規ADR自身のIDより広い形式を許可します。
const decisionReferenceIdSchema = trimmedText(
  ENGINEERING_NOTE_DRAFT_LIMITS.identifierCharacters,
).regex(
  /^(?:[A-Z0-9]+(?:-[A-Z0-9]+)*-)?ADR-\d{4}$/,
  "ADR reference must use ADR-0001 or PROJECT-ADR-0001 format.",
);

const isoDateTimeSchema = trimmedText(40).refine(isIso8601DateTime, {
  message: "Date must be an ISO 8601 datetime with a timezone.",
});

/**
 * Phase 1で空行と重複が手入力時の問題になったため、空文字は各要素schemaで拒否し、
 * 完全一致する重複だけをtrim後に除去します。
 */
const uniqueStringArray = (itemMax: number, arrayMax = 20) =>
  z.array(trimmedText(itemMax)).max(arrayMax).transform(normalizeUniqueStrings);

const relationshipSlugArraySchema = uniqueStringArray(
  ENGINEERING_NOTE_DRAFT_LIMITS.identifierCharacters,
  ENGINEERING_NOTE_DRAFT_LIMITS.arrayItems,
).pipe(z.array(slugSchema));

const decisionIdArraySchema = uniqueStringArray(
  ENGINEERING_NOTE_DRAFT_LIMITS.identifierCharacters,
  ENGINEERING_NOTE_DRAFT_LIMITS.arrayItems,
).pipe(z.array(decisionReferenceIdSchema));

const tagArraySchema = uniqueStringArray(
  ENGINEERING_NOTE_DRAFT_LIMITS.tagCharacters,
  ENGINEERING_NOTE_DRAFT_LIMITS.arrayItems,
);

const bodyArraySchema = uniqueStringArray(
  ENGINEERING_NOTE_DRAFT_LIMITS.arrayItemCharacters,
  ENGINEERING_NOTE_DRAFT_LIMITS.arrayItems,
);

export const developmentLogDraftSchema = z
  .object({
    kind: z.literal("development-log"),
    title: trimmedText(ENGINEERING_NOTE_DRAFT_LIMITS.titleCharacters),
    slug: slugSchema,
    logDate: isoDateTimeSchema,
    project: trimmedText(ENGINEERING_NOTE_DRAFT_LIMITS.projectCharacters),
    summary: trimmedText(ENGINEERING_NOTE_DRAFT_LIMITS.summaryCharacters),
    implementation: trimmedText(
      ENGINEERING_NOTE_DRAFT_LIMITS.bodyCharacters,
    ).optional(),
    problem: trimmedText(
      ENGINEERING_NOTE_DRAFT_LIMITS.bodyCharacters,
    ).optional(),
    cause: trimmedText(ENGINEERING_NOTE_DRAFT_LIMITS.bodyCharacters).optional(),
    resolution: trimmedText(
      ENGINEERING_NOTE_DRAFT_LIMITS.bodyCharacters,
    ).optional(),
    lessonsLearned: trimmedText(
      ENGINEERING_NOTE_DRAFT_LIMITS.bodyCharacters,
    ).optional(),
    nextActions: bodyArraySchema.optional(),
    relatedWorkSlugs: relationshipSlugArraySchema.optional(),
    relatedDecisionIds: decisionIdArraySchema.optional(),
    tags: tagArraySchema.optional(),
  })
  // strictにすることで、公開状態や将来追加された未知fieldを黙って捨てません。
  .strict();

export const architectureDecisionOptionDraftSchema = z
  .object({
    name: trimmedText(ENGINEERING_NOTE_DRAFT_LIMITS.titleCharacters),
    description: trimmedText(
      ENGINEERING_NOTE_DRAFT_LIMITS.optionDescriptionCharacters,
    ).optional(),
    pros: bodyArraySchema.optional(),
    cons: bodyArraySchema.optional(),
  })
  .strict();

export const architectureDecisionDraftSchema = z
  .object({
    kind: z.literal("architecture-decision"),
    decisionId: decisionIdSchema,
    title: trimmedText(ENGINEERING_NOTE_DRAFT_LIMITS.titleCharacters),
    slug: slugSchema,
    project: trimmedText(ENGINEERING_NOTE_DRAFT_LIMITS.projectCharacters),
    decisionStatus: z.enum(["proposed", "accepted", "superseded"]),
    context: trimmedText(ENGINEERING_NOTE_DRAFT_LIMITS.bodyCharacters),
    options: z
      .array(architectureDecisionOptionDraftSchema)
      .min(1)
      .max(ENGINEERING_NOTE_DRAFT_LIMITS.arrayItems),
    decision: trimmedText(ENGINEERING_NOTE_DRAFT_LIMITS.bodyCharacters),
    rationale: trimmedText(ENGINEERING_NOTE_DRAFT_LIMITS.bodyCharacters),
    positiveConsequences: bodyArraySchema.optional(),
    negativeConsequences: bodyArraySchema.optional(),
    decidedAt: isoDateTimeSchema.optional(),
    supersedesDecisionId: decisionReferenceIdSchema.optional(),
    relatedWorkSlugs: relationshipSlugArraySchema.optional(),
    relatedLogSlugs: relationshipSlugArraySchema.optional(),
    tags: tagArraySchema.optional(),
  })
  .strict();

/** kindを先に読むため、エラーと戻り値の型が2種類の入力へ正しく分岐します。 */
export const engineeringNoteDraftSchema = z.discriminatedUnion("kind", [
  developmentLogDraftSchema,
  architectureDecisionDraftSchema,
]);

export function parseEngineeringNoteDraft(input: unknown) {
  return engineeringNoteDraftSchema.parse(input);
}

/**
 * Phase 4のCLIがDB接続前に利用できるJSON境界です。
 * JavaScriptの文字数ではなくUTF-8 byte数を測り、日本語を含むファイルにも同じ上限を適用します。
 */
export function parseEngineeringNoteDraftJson(json: string) {
  if (
    Buffer.byteLength(json, "utf8") > ENGINEERING_NOTE_DRAFT_LIMITS.fileBytes
  ) {
    throw new RangeError(
      `Draft JSON must be ${ENGINEERING_NOTE_DRAFT_LIMITS.fileBytes} bytes or less.`,
    );
  }

  return parseEngineeringNoteDraft(JSON.parse(json) as unknown);
}
