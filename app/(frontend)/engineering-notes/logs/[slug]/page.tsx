import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  NoteTypeLabel,
  RelatedWorks,
  TagList,
} from "@/components/engineering-notes";
import { Section } from "@/components/site-shell";
import {
  findRelatedDecisions,
  getPublicDevelopmentLogBySlug,
  getPublicEngineeringNotes,
} from "@/lib/engineering-notes/public";
import { formatLongDate } from "@/lib/formatDate";

type Props = {
  params: Promise<{ slug: string }>;
};

// 公開状態の変更が最大5分で詳細ページへ反映されるようISRを有効にします。
export const revalidate = 300;

/** build時点で公開中の日誌を事前生成し、新しいslugは初回アクセス時にも生成可能にします。 */
export async function generateStaticParams() {
  const { developmentLogs } = await getPublicEngineeringNotes();
  return developmentLogs.map((log) => ({ slug: log.slug }));
}

/** metadataにも公開Queryを使い、privateなtitleをheadから漏らさないようにします。 */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const log = await getPublicDevelopmentLogBySlug(slug);

  if (!log) {
    return { title: "Development Log not found" };
  }

  return { title: log.title, description: log.summary };
}

/** 開発日誌の問題・原因・解決・学びを項目別に表示します。 */
export default async function DevelopmentLogDetailPage({ params }: Props) {
  const { slug } = await params;
  const [log, notes] = await Promise.all([
    getPublicDevelopmentLogBySlug(slug),
    getPublicEngineeringNotes(),
  ]);

  if (!log) {
    notFound();
  }

  const relatedDecisions = findRelatedDecisions(
    log,
    notes.architectureDecisions,
  );

  return (
    <>
      <header className="border-b border-stone-200 bg-[#f8f5ef]">
        <div className="mx-auto w-full max-w-6xl px-5 py-14 sm:px-8 sm:py-20">
          <Link
            href="/engineering-notes"
            className="text-sm font-semibold text-[#2f6f73] underline"
          >
            Engineering Notesへ戻る
          </Link>
          <div className="mt-6">
            <NoteTypeLabel type="log" />
          </div>
          <p className="mt-4 text-sm text-stone-500">
            {formatLongDate(log.logDate)} · {log.project}
          </p>
          <h1 className="mt-3 max-w-4xl text-4xl font-semibold leading-tight text-[#15231f] sm:text-6xl">
            {log.title}
          </h1>
          <p className="mt-6 max-w-3xl text-lg leading-8 text-stone-700">
            {log.summary}
          </p>
          <TagList tags={log.tags} />
        </div>
      </header>

      <Section title="実装と問題解決">
        <div className="grid gap-6 md:grid-cols-2">
          <LogTextPanel title="実装内容" value={log.implementation} />
          <LogTextPanel title="問題" value={log.problem} />
          <LogTextPanel title="原因" value={log.cause} />
          <LogTextPanel title="解決方法" value={log.resolution} />
          <LogTextPanel
            title="学んだこと"
            value={log.lessonsLearned}
            className="md:col-span-2"
          />
        </div>
      </Section>

      <Section title="次に行うこと">
        {log.nextActions.length ? (
          <ul className="grid gap-3">
            {log.nextActions.map((action) => (
              <li
                key={action}
                className="rounded-lg border border-stone-200 bg-white px-5 py-4 text-stone-700"
              >
                {action}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-stone-500">記録された次の作業はありません。</p>
        )}
      </Section>

      <Section title="関連情報">
        <div className="grid gap-8 md:grid-cols-2">
          <div>
            <h3 className="text-xl font-semibold text-[#15231f]">関連Work</h3>
            <div className="mt-4">
              <RelatedWorks works={log.relatedWorks} />
            </div>
          </div>
          <div>
            <h3 className="text-xl font-semibold text-[#15231f]">関連ADR</h3>
            <div className="mt-4">
              {relatedDecisions.length ? (
                <ul className="grid gap-3">
                  {relatedDecisions.map((decision) => (
                    <li key={decision.id}>
                      <Link
                        href={`/engineering-notes/decisions/${decision.slug}`}
                        className="font-semibold text-[#2f6f73] underline"
                      >
                        {decision.decisionId}: {decision.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-stone-500">公開中の関連ADRはありません。</p>
              )}
            </div>
          </div>
        </div>
      </Section>
    </>
  );
}

/** 値が未記録でも項目の意味を保ちつつ、空文字を不自然に表示しない詳細panelです。 */
function LogTextPanel({
  title,
  value,
  className = "",
}: {
  title: string;
  value?: string;
  className?: string;
}) {
  return (
    <section
      className={`rounded-lg border border-stone-200 bg-white p-6 ${className}`}
    >
      <h3 className="text-xl font-semibold text-[#15231f]">{title}</h3>
      <p className="mt-3 whitespace-pre-wrap leading-8 text-stone-700">
        {value ?? "記録はありません。"}
      </p>
    </section>
  );
}
