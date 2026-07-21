import Link from "next/link";
import type {
  ArchitectureDecisionResult,
  DevelopmentLogResult,
  RelatedWorkSummary,
} from "@/lib/engineering-notes/types";
import { formatLongDate } from "@/lib/formatDate";
import { Badge } from "./site-shell";

/** 一覧カードで日誌とADRを視覚的・意味的に区別する表示情報です。 */
const noteTypeStyles = {
  decision: {
    label: "Architecture Decision",
    className: "bg-[#15231f] text-white",
  },
  log: {
    label: "Development Log",
    className: "bg-[#a9422f] text-white",
  },
} as const;

/** 開発日誌の概要を詳細ページへのリンク付きカードとして表示します。 */
export function DevelopmentLogCard({ log }: { log: DevelopmentLogResult }) {
  return (
    <article className="flex h-full flex-col rounded-lg border border-stone-200 bg-white p-6 shadow-sm">
      <NoteTypeLabel type="log" />
      <p className="mt-4 text-sm text-stone-500">
        {formatLongDate(log.logDate)} · {log.project}
      </p>
      <h2 className="mt-2 text-2xl font-semibold text-[#15231f]">
        <Link
          href={`/engineering-notes/logs/${log.slug}`}
          className="transition hover:text-[#2f6f73]"
        >
          {log.title}
        </Link>
      </h2>
      <p className="mt-4 flex-1 leading-7 text-stone-700">{log.summary}</p>
      <TagList tags={log.tags} />
    </article>
  );
}

/** ADRの状態と概要を表示し、開発日誌カードと同じ一覧gridで扱えるようにします。 */
export function ArchitectureDecisionCard({
  decision,
}: {
  decision: ArchitectureDecisionResult;
}) {
  return (
    <article className="flex h-full flex-col rounded-lg border border-stone-200 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-center gap-2">
        <NoteTypeLabel type="decision" />
        <span className="text-xs font-semibold uppercase tracking-wide text-stone-500">
          {decision.decisionStatus}
        </span>
      </div>
      <p className="mt-4 text-sm text-stone-500">
        {decision.decidedAt ? formatLongDate(decision.decidedAt) : "検討中"} ·{" "}
        {decision.project} · {decision.decisionId}
      </p>
      <h2 className="mt-2 text-2xl font-semibold text-[#15231f]">
        <Link
          href={`/engineering-notes/decisions/${decision.slug}`}
          className="transition hover:text-[#2f6f73]"
        >
          {decision.title}
        </Link>
      </h2>
      <p className="mt-4 flex-1 leading-7 text-stone-700">
        {decision.context}
      </p>
      <TagList tags={decision.tags} />
    </article>
  );
}

/** 詳細ページ上部でコンテンツ種別を短く示します。 */
export function NoteTypeLabel({
  type,
}: {
  type: keyof typeof noteTypeStyles;
}) {
  const style = noteTypeStyles[type];

  return (
    <span
      className={`inline-flex w-fit rounded px-2.5 py-1 text-xs font-semibold uppercase tracking-wide ${style.className}`}
    >
      {style.label}
    </span>
  );
}

/** tagがない記録では余白を作らず、存在する場合だけ共通Badgeで表示します。 */
export function TagList({ tags }: { tags: string[] }) {
  if (!tags.length) {
    return null;
  }

  return (
    <div className="mt-5 flex flex-wrap gap-2" aria-label="Tags">
      {tags.map((tag) => (
        <Badge key={tag}>{tag}</Badge>
      ))}
    </div>
  );
}

/** 関連Workを既存の実績詳細ページへ接続します。 */
export function RelatedWorks({ works }: { works: RelatedWorkSummary[] }) {
  if (!works.length) {
    return <p className="text-stone-500">関連する実績はありません。</p>;
  }

  return (
    <ul className="grid gap-3">
      {works.map((work) => (
        <li key={work.slug}>
          <Link
            href={`/works/${work.slug}`}
            className="font-semibold text-[#2f6f73] underline"
          >
            {work.title}
          </Link>
        </li>
      ))}
    </ul>
  );
}
