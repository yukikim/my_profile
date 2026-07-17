/** Engineering Notesを利用する呼び出し元を表します。 */
export type EngineeringNotesAudience = "public-site" | "trusted-mcp";

/** trusted-mcpが検索対象の公開範囲を絞り込むための値です。 */
export type EngineeringNoteVisibility = "all" | "private" | "public";

/** 2つのEngineering Notes検索で共有する入力条件です。 */
export type BaseEngineeringNoteQuery = {
  audience: EngineeringNotesAudience;
  from?: string;
  limit?: number;
  project?: string;
  query?: string;
  relatedWorkSlug?: string;
  tags?: string[];
  to?: string;
  visibility?: EngineeringNoteVisibility;
};

export type DevelopmentLogQuery = BaseEngineeringNoteQuery;

export type ArchitectureDecisionQuery = BaseEngineeringNoteQuery & {
  decisionStatus?: "accepted" | "proposed" | "superseded";
};

/** relationshipをMCPや画面へ返すときの最小表現です。 */
export type RelatedWorkSummary = {
  slug: string;
  title: string;
};

/**
 * 開発日誌の安全な出力型です。
 * Payload Document全体ではなく、外部利用を許可したフィールドだけを定義します。
 */
export type DevelopmentLogResult = {
  cause?: string;
  id: string;
  implementation?: string;
  lessonsLearned?: string;
  logDate: string;
  nextActions: string[];
  problem?: string;
  project: string;
  relatedDecisionIds: string[];
  relatedWorks: RelatedWorkSummary[];
  resolution?: string;
  slug: string;
  summary: string;
  tags: string[];
  title: string;
  visibility: "private" | "public";
};

export type ArchitectureDecisionOptionResult = {
  cons: string[];
  description?: string;
  name: string;
  pros: string[];
};

/** ADRの安全な出力型です。認証情報やPayload内部フィールドは含めません。 */
export type ArchitectureDecisionResult = {
  context: string;
  decidedAt?: string;
  decision: string;
  decisionId: string;
  decisionStatus: "accepted" | "proposed" | "superseded";
  id: string;
  negativeConsequences: string[];
  options: ArchitectureDecisionOptionResult[];
  positiveConsequences: string[];
  project: string;
  rationale: string;
  relatedLogSlugs: string[];
  relatedWorks: RelatedWorkSummary[];
  slug: string;
  supersedesDecisionId?: string;
  tags: string[];
  title: string;
  visibility: "private" | "public";
};
