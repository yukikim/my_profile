import type { Payload } from "payload";
import type { ResolvedEngineeringNoteRelationships } from "./relationships";
import type {
  ArchitectureDecisionDraft,
  DevelopmentLogDraft,
  EngineeringNoteDraft,
} from "./types";

export type CreatedEngineeringNoteDraft = {
  id: number;
  kind: EngineeringNoteDraft["kind"];
  slug: string;
  decisionId?: string;
};

/** DBやPayload由来のmessage・SQL・stackを保持しない、作成失敗専用の安全なエラーです。 */
export class EngineeringNoteCreateError extends Error {
  readonly code = "CREATE_FAILED" as const;

  constructor() {
    super("Engineering Note draft creation failed.");
    this.name = "EngineeringNoteCreateError";
  }
}

type CreatePayload = Pick<Payload, "create">;

function mapTextItems(items: readonly string[] | undefined) {
  return items?.map((item) => ({ item }));
}

function mapTags(tags: readonly string[] | undefined) {
  return tags?.map((label) => ({ label }));
}

/** JSON用の単純なstring配列をDevelopment Logs Collectionのarray fieldへ変換します。 */
function mapDevelopmentLogData(
  draft: DevelopmentLogDraft,
  relationships: ResolvedEngineeringNoteRelationships,
) {
  return {
    title: draft.title,
    slug: draft.slug,
    logDate: draft.logDate,
    project: draft.project,
    summary: draft.summary,
    implementation: draft.implementation,
    problem: draft.problem,
    cause: draft.cause,
    resolution: draft.resolution,
    lessonsLearned: draft.lessonsLearned,
    nextActions: draft.nextActions?.map((task) => ({ task })),
    relatedWorks: relationships.relatedWorkIds,
    relatedDecisions: relationships.relatedArchitectureDecisionIds,
    tags: mapTags(draft.tags),
    // 公開状態は入力値を参照せず、登録境界で必ず非公開下書きへ固定します。
    status: "draft" as const,
    visibility: "private" as const,
  };
}

/** options内のpros/consを含め、ADR JSONをPayloadの入れ子array構造へ変換します。 */
function mapArchitectureDecisionData(
  draft: ArchitectureDecisionDraft,
  relationships: ResolvedEngineeringNoteRelationships,
) {
  return {
    decisionId: draft.decisionId,
    title: draft.title,
    slug: draft.slug,
    project: draft.project,
    decisionStatus: draft.decisionStatus,
    context: draft.context,
    options: draft.options.map((option) => ({
      name: option.name,
      description: option.description,
      pros: mapTextItems(option.pros),
      cons: mapTextItems(option.cons),
    })),
    decision: draft.decision,
    rationale: draft.rationale,
    positiveConsequences: mapTextItems(draft.positiveConsequences),
    negativeConsequences: mapTextItems(draft.negativeConsequences),
    decidedAt: draft.decidedAt,
    supersedes: relationships.supersedesArchitectureDecisionId,
    relatedWorks: relationships.relatedWorkIds,
    relatedLogs: relationships.relatedDevelopmentLogIds,
    tags: mapTags(draft.tags),
    status: "draft" as const,
    visibility: "private" as const,
  };
}

/**
 * kindからCollectionをコード側で固定し、Payload Local APIのcreateだけを呼びます。
 * このmoduleにはupdate・delete・upsert・publish処理を置かず、常に新規draft 1件が単位です。
 */
export async function createEngineeringNoteDraft(
  payload: CreatePayload,
  draft: EngineeringNoteDraft,
  relationships: ResolvedEngineeringNoteRelationships,
): Promise<CreatedEngineeringNoteDraft> {
  try {
    if (draft.kind === "development-log") {
      const created = await payload.create({
        collection: "development-logs",
        data: mapDevelopmentLogData(draft, relationships),
        // Collection fieldだけでなくPayloadのversion状態もdraftへ固定します。
        draft: true,
        overrideAccess: true,
      });

      return {
        id: created.id,
        kind: draft.kind,
        slug: draft.slug,
      };
    }

    const created = await payload.create({
      collection: "architecture-decisions",
      data: mapArchitectureDecisionData(draft, relationships),
      draft: true,
      overrideAccess: true,
    });

    return {
      id: created.id,
      kind: draft.kind,
      slug: draft.slug,
      decisionId: draft.decisionId,
    };
  } catch {
    // 元例外をcauseにも残さず、CLIへは固定codeだけを渡します。
    throw new EngineeringNoteCreateError();
  }
}
