import type {
  ArchitectureDecision,
  DevelopmentLog,
  Work,
} from "@/payload-types";
import type {
  ArchitectureDecisionResult,
  DevelopmentLogResult,
  RelatedWorkSummary,
} from "./types";

/**
 * relationshipはdepthによってIDまたはDocumentになるため、公開に必要な
 * titleとslugを持つDocumentだけを安全な要約へ変換します。
 */
function mapRelatedWork(work: number | Work): RelatedWorkSummary | null {
  if (typeof work === "number") {
    return null;
  }

  return {
    slug: work.slug,
    title: work.title,
  };
}

/**
 * depth付き取得でもDocumentへ展開されないIDは、アクセス制御で隠された関連先の可能性があります。
 * DB内部IDを公開用のslugやADR IDとして代用せず、展開済みDocumentだけを採用します。
 */
function mapRelatedDecisionId(
  decision: number | ArchitectureDecision,
): string | null {
  return typeof decision === "number" ? null : decision.decisionId;
}

function mapRelatedLogSlug(log: number | DevelopmentLog): string | null {
  return typeof log === "number" ? null : log.slug;
}

/** 開発日誌のPayload Documentをallowlist形式へ変換します。 */
export function mapDevelopmentLog(log: DevelopmentLog): DevelopmentLogResult {
  return {
    cause: log.cause ?? undefined,
    id: String(log.id),
    implementation: log.implementation ?? undefined,
    lessonsLearned: log.lessonsLearned ?? undefined,
    logDate: log.logDate,
    nextActions: log.nextActions?.map((action) => action.task) ?? [],
    problem: log.problem ?? undefined,
    project: log.project,
    relatedDecisionIds:
      log.relatedDecisions
        ?.map(mapRelatedDecisionId)
        .filter((decisionId): decisionId is string => decisionId !== null) ??
      [],
    relatedWorks:
      log.relatedWorks
        ?.map(mapRelatedWork)
        .filter((work): work is RelatedWorkSummary => work !== null) ?? [],
    resolution: log.resolution ?? undefined,
    slug: log.slug,
    summary: log.summary,
    tags: log.tags?.map((tag) => tag.label) ?? [],
    title: log.title,
    visibility: log.visibility,
  };
}

/** ADRのPayload Documentをallowlist形式へ変換します。 */
export function mapArchitectureDecision(
  architectureDecision: ArchitectureDecision,
): ArchitectureDecisionResult {
  return {
    context: architectureDecision.context,
    decidedAt: architectureDecision.decidedAt ?? undefined,
    decision: architectureDecision.decision,
    decisionId: architectureDecision.decisionId,
    decisionStatus: architectureDecision.decisionStatus,
    id: String(architectureDecision.id),
    negativeConsequences:
      architectureDecision.negativeConsequences?.map((item) => item.item) ?? [],
    options: architectureDecision.options.map((option) => ({
      cons: option.cons?.map((item) => item.item) ?? [],
      description: option.description ?? undefined,
      name: option.name,
      pros: option.pros?.map((item) => item.item) ?? [],
    })),
    positiveConsequences:
      architectureDecision.positiveConsequences?.map((item) => item.item) ?? [],
    project: architectureDecision.project,
    rationale: architectureDecision.rationale,
    relatedLogSlugs:
      architectureDecision.relatedLogs
        ?.map(mapRelatedLogSlug)
        .filter((slug): slug is string => slug !== null) ?? [],
    relatedWorks:
      architectureDecision.relatedWorks
        ?.map(mapRelatedWork)
        .filter((work): work is RelatedWorkSummary => work !== null) ?? [],
    slug: architectureDecision.slug,
    supersedesDecisionId:
      typeof architectureDecision.supersedes === "number"
        ? undefined
        : architectureDecision.supersedes?.decisionId,
    tags: architectureDecision.tags?.map((tag) => tag.label) ?? [],
    title: architectureDecision.title,
    visibility: architectureDecision.visibility,
  };
}
