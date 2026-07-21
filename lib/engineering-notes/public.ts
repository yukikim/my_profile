import { cache } from "react";
import { getArchitectureDecisions } from "@/lib/payload/getArchitectureDecisions";
import { getDevelopmentLogs } from "@/lib/payload/getDevelopmentLogs";
import type {
  ArchitectureDecisionResult,
  DevelopmentLogResult,
} from "./types";

/** 公開画面で一度に扱う上限です。Query Service側の最大値と合わせて大量取得を防ぎます。 */
const PUBLIC_ENGINEERING_NOTES_LIMIT = 50;

/** 一覧・詳細・metadataが共有する公開済みEngineering Notesを取得します。 */
export const getPublicEngineeringNotes = cache(async () => {
  const [developmentLogs, architectureDecisions] = await Promise.all([
    getDevelopmentLogs({
      audience: "public-site",
      limit: PUBLIC_ENGINEERING_NOTES_LIMIT,
      visibility: "public",
    }),
    getArchitectureDecisions({
      audience: "public-site",
      limit: PUBLIC_ENGINEERING_NOTES_LIMIT,
      visibility: "public",
    }),
  ]);

  return { developmentLogs, architectureDecisions };
});

/** URL slugと完全一致する公開日誌だけを返し、部分一致による別記事表示を防ぎます。 */
export const getPublicDevelopmentLogBySlug = cache(async (slug: string) => {
  const { developmentLogs } = await getPublicEngineeringNotes();
  return developmentLogs.find((log) => log.slug === slug);
});

/** URL slugと完全一致する公開ADRだけを返します。privateやdraftは元の公開Queryで除外済みです。 */
export const getPublicArchitectureDecisionBySlug = cache(
  async (slug: string) => {
    const { architectureDecisions } = await getPublicEngineeringNotes();
    return architectureDecisions.find((decision) => decision.slug === slug);
  },
);

/** 日誌側・ADR側どちらからrelationshipを設定しても相互リンクへ反映できるよう統合します。 */
export function findRelatedDecisions(
  log: DevelopmentLogResult,
  decisions: ArchitectureDecisionResult[],
) {
  return decisions.filter(
    (decision) =>
      log.relatedDecisionIds.includes(decision.decisionId) ||
      decision.relatedLogSlugs.includes(log.slug),
  );
}

/** ADRから参照された日誌と、日誌からADRを参照した場合の両方を解決します。 */
export function findRelatedDevelopmentLogs(
  decision: ArchitectureDecisionResult,
  logs: DevelopmentLogResult[],
) {
  return logs.filter(
    (log) =>
      decision.relatedLogSlugs.includes(log.slug) ||
      log.relatedDecisionIds.includes(decision.decisionId),
  );
}

/** supersedes関係の対象もpublicである場合だけリンク可能なADRとして返します。 */
export function findSupersededDecision(
  decision: ArchitectureDecisionResult,
  decisions: ArchitectureDecisionResult[],
) {
  return decisions.find(
    (candidate) => candidate.decisionId === decision.supersedesDecisionId,
  );
}
