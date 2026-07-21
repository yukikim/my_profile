import type { Metadata } from "next";
import {
  ArchitectureDecisionCard,
  DevelopmentLogCard,
} from "@/components/engineering-notes";
import { PageIntro, Section } from "@/components/site-shell";
import { getPublicEngineeringNotes } from "@/lib/engineering-notes/public";

export const metadata: Metadata = {
  title: "Engineering Notes",
  description:
    "開発日誌と設計判断を通して、実装過程、問題解決、技術選定の理由を紹介します。",
};

// Payloadの更新を公開画面へ反映しつつ、リクエストごとのDB接続を避ける5分間のISR設定です。
export const revalidate = 300;

/** 日誌とADRを共通の時系列へ並べるために使う一覧項目型です。 */
type EngineeringNoteListItem =
  | {
      type: "decision";
      date?: string;
      decision: Awaited<
        ReturnType<typeof getPublicEngineeringNotes>
      >["architectureDecisions"][number];
    }
  | {
      type: "log";
      date: string;
      log: Awaited<
        ReturnType<typeof getPublicEngineeringNotes>
      >["developmentLogs"][number];
    };

/** 公開可能な日誌とADRだけを取得し、新しい記録から同じ一覧へ表示します。 */
export default async function EngineeringNotesPage() {
  const { developmentLogs, architectureDecisions } =
    await getPublicEngineeringNotes();
  const notes: EngineeringNoteListItem[] = [
    ...developmentLogs.map((log) => ({
      type: "log" as const,
      date: log.logDate,
      log,
    })),
    ...architectureDecisions.map((decision) => ({
      type: "decision" as const,
      date: decision.decidedAt,
      decision,
    })),
  ].sort((left, right) =>
    (right.date ?? "").localeCompare(left.date ?? ""),
  );

  return (
    <>
      <PageIntro
        eyebrow="Engineering Notes"
        title="How and why it was built"
        description="完成した成果だけでなく、実装で直面した問題、解決までの過程、設計判断の理由を公開可能な範囲で記録しています。"
      />
      <Section title="開発日誌・設計判断">
        {notes.length ? (
          <div className="grid gap-6 md:grid-cols-2">
            {notes.map((note) =>
              note.type === "log" ? (
                <DevelopmentLogCard key={`log-${note.log.id}`} log={note.log} />
              ) : (
                <ArchitectureDecisionCard
                  key={`decision-${note.decision.id}`}
                  decision={note.decision}
                />
              ),
            )}
          </div>
        ) : (
          <p className="rounded-lg border border-stone-200 bg-white p-6 text-stone-600">
            現在公開中のEngineering Notesはありません。
          </p>
        )}
      </Section>
    </>
  );
}
