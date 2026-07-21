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
  findRelatedDevelopmentLogs,
  findSupersededDecision,
  getPublicArchitectureDecisionBySlug,
  getPublicEngineeringNotes,
} from "@/lib/engineering-notes/public";
import { formatLongDate } from "@/lib/formatDate";

type Props = {
  params: Promise<{ slug: string }>;
};

export const revalidate = 300;

/** build時点で公開中のADRを静的生成対象としてNext.jsへ渡します。 */
export async function generateStaticParams() {
  const { architectureDecisions } = await getPublicEngineeringNotes();
  return architectureDecisions.map((decision) => ({ slug: decision.slug }));
}

/** ADRの公開可否を確認したうえでtitleと背景をmetadataへ利用します。 */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const decision = await getPublicArchitectureDecisionBySlug(slug);

  if (!decision) {
    return { title: "Architecture Decision not found" };
  }

  return { title: decision.title, description: decision.context };
}

/** ADRの背景、候補、結論、理由、影響、関連記録を順番に表示します。 */
export default async function ArchitectureDecisionDetailPage({
  params,
}: Props) {
  const { slug } = await params;
  const [decision, notes] = await Promise.all([
    getPublicArchitectureDecisionBySlug(slug),
    getPublicEngineeringNotes(),
  ]);

  if (!decision) {
    notFound();
  }

  const relatedLogs = findRelatedDevelopmentLogs(
    decision,
    notes.developmentLogs,
  );
  const supersededDecision = findSupersededDecision(
    decision,
    notes.architectureDecisions,
  );
  const supersedingDecisions = notes.architectureDecisions.filter(
    (candidate) => candidate.supersedesDecisionId === decision.decisionId,
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
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <NoteTypeLabel type="decision" />
            <span className="text-sm font-semibold uppercase tracking-wide text-stone-500">
              {decision.decisionStatus}
            </span>
          </div>
          <p className="mt-4 text-sm text-stone-500">
            {decision.decidedAt
              ? formatLongDate(decision.decidedAt)
              : "判断日未設定"}{" "}
            · {decision.project} · {decision.decisionId}
          </p>
          <h1 className="mt-3 max-w-4xl text-4xl font-semibold leading-tight text-[#15231f] sm:text-6xl">
            {decision.title}
          </h1>
          <p className="mt-6 max-w-3xl text-lg leading-8 text-stone-700">
            {decision.context}
          </p>
          <TagList tags={decision.tags} />
        </div>
      </header>

      <Section title="判断と理由">
        <div className="grid gap-6 md:grid-cols-2">
          <DecisionTextPanel title="採用した方針" value={decision.decision} />
          <DecisionTextPanel title="採用理由" value={decision.rationale} />
        </div>
      </Section>

      <Section title="比較した選択肢">
        <div className="grid gap-6 md:grid-cols-2">
          {decision.options.map((option) => (
            <article
              key={option.name}
              className="rounded-lg border border-stone-200 bg-white p-6"
            >
              <h3 className="text-xl font-semibold text-[#15231f]">
                {option.name}
              </h3>
              {option.description ? (
                <p className="mt-3 leading-7 text-stone-700">
                  {option.description}
                </p>
              ) : null}
              <OptionPoints title="Pros" items={option.pros} />
              <OptionPoints title="Cons" items={option.cons} />
            </article>
          ))}
        </div>
      </Section>

      <Section title="判断による影響">
        <div className="grid gap-6 md:grid-cols-2">
          <ConsequenceList
            title="得られること"
            items={decision.positiveConsequences}
          />
          <ConsequenceList
            title="受け入れること"
            items={decision.negativeConsequences}
          />
        </div>
      </Section>

      <Section title="関連情報">
        <div className="grid gap-8 md:grid-cols-3">
          <div>
            <h3 className="text-xl font-semibold text-[#15231f]">関連Work</h3>
            <div className="mt-4">
              <RelatedWorks works={decision.relatedWorks} />
            </div>
          </div>
          <div>
            <h3 className="text-xl font-semibold text-[#15231f]">関連日誌</h3>
            <div className="mt-4">
              {relatedLogs.length ? (
                <ul className="grid gap-3">
                  {relatedLogs.map((log) => (
                    <li key={log.id}>
                      <Link
                        href={`/engineering-notes/logs/${log.slug}`}
                        className="font-semibold text-[#2f6f73] underline"
                      >
                        {log.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-stone-500">公開中の関連日誌はありません。</p>
              )}
            </div>
          </div>
          <div>
            <h3 className="text-xl font-semibold text-[#15231f]">判断の変遷</h3>
            <div className="mt-4 grid gap-3">
              {supersededDecision ? (
                <DecisionLink
                  prefix="置き換えたADR"
                  decision={supersededDecision}
                />
              ) : null}
              {supersedingDecisions.map((item) => (
                <DecisionLink
                  key={item.id}
                  prefix="このADRを置き換えたADR"
                  decision={item}
                />
              ))}
              {!supersededDecision && !supersedingDecisions.length ? (
                <p className="text-stone-500">公開中の置換関係はありません。</p>
              ) : null}
            </div>
          </div>
        </div>
      </Section>
    </>
  );
}

/** ADR本文の重要な2項目を同じ視覚構造で表示します。 */
function DecisionTextPanel({ title, value }: { title: string; value: string }) {
  return (
    <article className="rounded-lg border border-stone-200 bg-white p-6">
      <h3 className="text-xl font-semibold text-[#15231f]">{title}</h3>
      <p className="mt-3 whitespace-pre-wrap leading-8 text-stone-700">
        {value}
      </p>
    </article>
  );
}

/** 選択肢ごとの長所・短所を見出し付きlistで表示します。 */
function OptionPoints({ title, items }: { title: string; items: string[] }) {
  if (!items.length) {
    return null;
  }

  return (
    <div className="mt-5">
      <h4 className="text-sm font-semibold uppercase tracking-wide text-stone-500">
        {title}
      </h4>
      <ul className="mt-2 list-disc space-y-2 pl-5 text-stone-700">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

/** 判断後の利点・制約が0件でも情報が未記録だと明示するlistです。 */
function ConsequenceList({ title, items }: { title: string; items: string[] }) {
  return (
    <article className="rounded-lg border border-stone-200 bg-white p-6">
      <h3 className="text-xl font-semibold text-[#15231f]">{title}</h3>
      {items.length ? (
        <ul className="mt-4 list-disc space-y-3 pl-5 leading-7 text-stone-700">
          {items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-stone-500">記録はありません。</p>
      )}
    </article>
  );
}

/** publicで取得できたADRだけを安全な内部リンクとして表示します。 */
function DecisionLink({
  prefix,
  decision,
}: {
  prefix: string;
  decision: Awaited<
    ReturnType<typeof getPublicEngineeringNotes>
  >["architectureDecisions"][number];
}) {
  return (
    <p className="text-sm leading-6 text-stone-600">
      {prefix}:{" "}
      <Link
        href={`/engineering-notes/decisions/${decision.slug}`}
        className="font-semibold text-[#2f6f73] underline"
      >
        {decision.decisionId}
      </Link>
    </p>
  );
}
