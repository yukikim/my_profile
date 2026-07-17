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

/** 開発日誌のPayload Documentをallowlist形式へ変換します。 */
export function mapDevelopmentLog(
  log: DevelopmentLog,
): DevelopmentLogResult {
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
      log.relatedDecisions?.map((decision) =>
        typeof decision === "number"
          ? String(decision)
          : decision.decisionId,
      ) ?? [],
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
      architectureDecision.negativeConsequences?.map((item) => item.item) ??
      [],
    options: architectureDecision.options.map((option) => ({
      cons: option.cons?.map((item) => item.item) ?? [],
      description: option.description ?? undefined,
      name: option.name,
      pros: option.pros?.map((item) => item.item) ?? [],
    })),
    positiveConsequences:
      architectureDecision.positiveConsequences?.map((item) => item.item) ??
      [],
    project: architectureDecision.project,
    rationale: architectureDecision.rationale,
    relatedLogSlugs:
      architectureDecision.relatedLogs?.map((log) =>
        typeof log === "number" ? String(log) : log.slug,
      ) ?? [],
    relatedWorks:
      architectureDecision.relatedWorks
        ?.map(mapRelatedWork)
        .filter((work): work is RelatedWorkSummary => work !== null) ?? [],
    slug: architectureDecision.slug,
    supersedesDecisionId:
      typeof architectureDecision.supersedes === "number"
        ? String(architectureDecision.supersedes)
        : architectureDecision.supersedes?.decisionId,
    tags: architectureDecision.tags?.map((tag) => tag.label) ?? [],
    title: architectureDecision.title,
    visibility: architectureDecision.visibility,
  };
}
