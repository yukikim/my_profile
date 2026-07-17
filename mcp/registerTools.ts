import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import type {
  ArchitectureDecisionResult,
  DevelopmentLogResult,
} from "../lib/engineering-notes/types";
import type { EngineeringNotesDataSource } from "./dataSource";
import {
  createErrorToolResult,
  EngineeringNotesMcpError,
} from "./errors";
import {
  architectureDecisionListOutputSchema,
  decisionContextInputSchema,
  decisionContextOutputSchema,
  developmentLogListOutputSchema,
  projectHistoryInputSchema,
  projectHistoryOutputSchema,
  recentDevelopmentLogsInputSchema,
  relatedDecisionsInputSchema,
  searchArchitectureDecisionsInputSchema,
  searchDevelopmentLogsInputSchema,
} from "./schemas";

/** 全Toolに共通する安全性の宣言です。クライアントへ副作用がないことを伝えます。 */
const readOnlyAnnotations = {
  readOnlyHint: true,
  destructiveHint: false,
  idempotentHint: true,
  openWorldHint: false,
} as const;

/** 構造化結果と、人が読める同内容のJSONテキストを同時に返します。 */
function createSuccessResult(
  structuredContent: Record<string, unknown>,
): CallToolResult {
  return {
    content: [
      {
        type: "text",
        text: JSON.stringify(structuredContent, null, 2),
      },
    ],
    structuredContent,
  };
}

/** Tool内の例外を一か所で安全なMCPエラーへ変換します。 */
async function runSafely(
  action: () => Promise<Record<string, unknown>>,
): Promise<CallToolResult> {
  try {
    return createSuccessResult(await action());
  } catch (error) {
    return createErrorToolResult(error);
  }
}

/** 入力と完全一致するADRを探し、部分一致検索による取り違えを防ぎます。 */
async function findDecision(
  dataSource: EngineeringNotesDataSource,
  identifier: { decisionId?: string; slug?: string },
) {
  const query = identifier.decisionId ?? identifier.slug;
  const decisions = await dataSource.searchArchitectureDecisions({
    query,
    visibility: "all",
    limit: 50,
  });

  return decisions.find((decision) =>
    identifier.decisionId
      ? decision.decisionId === identifier.decisionId
      : decision.slug === identifier.slug,
  );
}

/** 開発日誌とADRの日付を比較し、日付なしADRは履歴の末尾へ配置します。 */
function compareHistoryDates(
  left: { date: string | null },
  right: { date: string | null },
) {
  return (right.date ?? "").localeCompare(left.date ?? "");
}

/**
 * Phase 4で定義した6つの読み取り専用ToolをMCPサーバーへ登録します。
 * 各handlerは必ずData Sourceを通るため、draft除外とallowlist変換を迂回できません。
 */
export function registerEngineeringNotesTools(
  server: McpServer,
  dataSource: EngineeringNotesDataSource,
) {
  server.registerTool(
    "search_development_logs",
    {
      title: "開発日誌を検索",
      description:
        "公開済みの開発日誌をキーワード、プロジェクト、タグ、日付、関連Workで検索する読み取り専用Toolです。",
      inputSchema: searchDevelopmentLogsInputSchema,
      outputSchema: developmentLogListOutputSchema,
      annotations: readOnlyAnnotations,
    },
    async (input) =>
      runSafely(async () => {
        const items = await dataSource.searchDevelopmentLogs(input);
        return { items, count: items.length, query: input };
      }),
  );

  server.registerTool(
    "get_recent_development_logs",
    {
      title: "直近の開発日誌を取得",
      description:
        "指定日数以内に公開された開発日誌を新しい順で返す読み取り専用Toolです。",
      inputSchema: recentDevelopmentLogsInputSchema,
      outputSchema: developmentLogListOutputSchema,
      annotations: readOnlyAnnotations,
    },
    async (input) =>
      runSafely(async () => {
        // 現在時刻を基準に期間開始を計算し、Query ServiceへISO文字列で渡します。
        const from = new Date(Date.now() - input.days * 86_400_000).toISOString();
        const items = await dataSource.searchDevelopmentLogs({
          project: input.project,
          from,
          visibility: "all",
          limit: input.limit,
        });
        return { items, count: items.length, query: { ...input, from } };
      }),
  );

  server.registerTool(
    "search_architecture_decisions",
    {
      title: "設計判断を検索",
      description:
        "公開済みのADRをキーワード、状態、タグ、関連Workで検索する読み取り専用Toolです。",
      inputSchema: searchArchitectureDecisionsInputSchema,
      outputSchema: architectureDecisionListOutputSchema,
      annotations: readOnlyAnnotations,
    },
    async (input) =>
      runSafely(async () => {
        const items = await dataSource.searchArchitectureDecisions(input);
        return { items, count: items.length, query: input };
      }),
  );

  server.registerTool(
    "get_project_history",
    {
      title: "プロジェクト履歴を取得",
      description:
        "指定プロジェクトの日誌とADRを時系列へ統合する読み取り専用Toolです。",
      inputSchema: projectHistoryInputSchema,
      outputSchema: projectHistoryOutputSchema,
      annotations: readOnlyAnnotations,
    },
    async (input) =>
      runSafely(async () => {
        // 統合前に各種別を最大50件取得し、統合・ソート後に利用者指定のlimitを適用します。
        const [logs, decisions] = await Promise.all([
          input.includeLogs
            ? dataSource.searchDevelopmentLogs({
                project: input.project,
                from: input.from,
                to: input.to,
                visibility: "all",
                limit: 50,
              })
            : Promise.resolve([] as DevelopmentLogResult[]),
          input.includeDecisions
            ? dataSource.searchArchitectureDecisions({
                project: input.project,
                from: input.from,
                to: input.to,
                visibility: "all",
                limit: 50,
              })
            : Promise.resolve([] as ArchitectureDecisionResult[]),
        ]);
        const items = [
          ...logs.map((developmentLog) => ({
            type: "development-log" as const,
            date: developmentLog.logDate,
            developmentLog,
          })),
          ...decisions.map((architectureDecision) => ({
            type: "architecture-decision" as const,
            date: architectureDecision.decidedAt ?? null,
            architectureDecision,
          })),
        ]
          .sort(compareHistoryDates)
          .slice(0, input.limit);

        return { items, count: items.length, query: input };
      }),
  );

  server.registerTool(
    "get_decision_context",
    {
      title: "設計判断の文脈を取得",
      description:
        "1件のADRと、そのADRから参照された関連日誌を返す読み取り専用Toolです。",
      inputSchema: decisionContextInputSchema,
      outputSchema: decisionContextOutputSchema,
      annotations: readOnlyAnnotations,
    },
    async (input) =>
      runSafely(async () => {
        const decision = await findDecision(dataSource, input);

        if (!decision) {
          throw new EngineeringNotesMcpError(
            "NOT_FOUND",
            "指定された設計判断は見つかりませんでした。",
          );
        }

        const relatedLogs = decision.relatedLogSlugs.length
          ? (await dataSource.searchDevelopmentLogs({
              project: decision.project,
              visibility: "all",
              limit: 50,
            })).filter((log) => decision.relatedLogSlugs.includes(log.slug))
          : [];

        return { decision, relatedLogs };
      }),
  );

  server.registerTool(
    "get_related_decisions",
    {
      title: "関連する設計判断を取得",
      description:
        "指定ADRの置換関係・共通Work、または指定Workに関連するADRを返す読み取り専用Toolです。",
      inputSchema: relatedDecisionsInputSchema,
      outputSchema: architectureDecisionListOutputSchema,
      annotations: readOnlyAnnotations,
    },
    async (input) =>
      runSafely(async () => {
        let items: ArchitectureDecisionResult[];

        if (input.workSlug) {
          items = await dataSource.searchArchitectureDecisions({
            relatedWorkSlug: input.workSlug,
            visibility: "all",
            limit: 50,
          });
        } else {
          const source = await findDecision(dataSource, {
            decisionId: input.decisionId,
          });

          if (!source) {
            throw new EngineeringNotesMcpError(
              "NOT_FOUND",
              "指定された設計判断は見つかりませんでした。",
            );
          }

          const sourceWorkSlugs = new Set(
            source.relatedWorks.map((work) => work.slug),
          );
          const candidates = await dataSource.searchArchitectureDecisions({
            project: source.project,
            visibility: "all",
            limit: 50,
          });

          items = candidates.filter(
            (candidate) =>
              candidate.decisionId !== source.decisionId &&
              (candidate.decisionId === source.supersedesDecisionId ||
                candidate.supersedesDecisionId === source.decisionId ||
                candidate.relatedWorks.some((work) =>
                  sourceWorkSlugs.has(work.slug),
                )),
          );
        }

        if (!input.includeSuperseded) {
          items = items.filter(
            (decision) => decision.decisionStatus !== "superseded",
          );
        }

        items = items.slice(0, input.limit);
        return { items, count: items.length, query: input };
      }),
  );
}
