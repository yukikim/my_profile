/**
 * Payloadが生成するDocument型とは分離した、登録前JSON専用の入力型です。
 * 公開状態を表すstatus / visibility / _statusをここへ持たせないことで、
 * 後続の登録処理が常にdraft + privateを強制できる境界を作ります。
 */
export type DevelopmentLogDraft = {
  kind: "development-log";
  title: string;
  slug: string;
  logDate: string;
  project: string;
  summary: string;
  implementation?: string;
  problem?: string;
  cause?: string;
  resolution?: string;
  lessonsLearned?: string;
  nextActions?: string[];
  relatedWorkSlugs?: string[];
  relatedDecisionIds?: string[];
  tags?: string[];
};

export type ArchitectureDecisionOptionDraft = {
  name: string;
  description?: string;
  pros?: string[];
  cons?: string[];
};

export type ArchitectureDecisionDraft = {
  kind: "architecture-decision";
  decisionId: string;
  title: string;
  slug: string;
  project: string;
  decisionStatus: "proposed" | "accepted" | "superseded";
  context: string;
  options: ArchitectureDecisionOptionDraft[];
  decision: string;
  rationale: string;
  positiveConsequences?: string[];
  negativeConsequences?: string[];
  decidedAt?: string;
  supersedesDecisionId?: string;
  relatedWorkSlugs?: string[];
  relatedLogSlugs?: string[];
  tags?: string[];
};

/** kindを判別キーにすると、呼び出し側はif文だけで安全に入力型を絞り込めます。 */
export type EngineeringNoteDraft =
  | DevelopmentLogDraft
  | ArchitectureDecisionDraft;
