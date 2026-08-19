import Link from "next/link";

export type BreadcrumbItem = {
  label: string;
  href?: string;
};

export function Breadcrumbs({ items }: { items: readonly BreadcrumbItem[] }) {
  const breadcrumbs: BreadcrumbItem[] = [
    { label: "Top", href: "/" },
    ...items,
  ];

  return (
    <nav
      aria-label="パンくずリスト"
      className="bg-white/70 fixed backdrop-blur mt-1 rounded-r-lg"
    >
      <ol className="mx-auto flex w-full max-w-7xl flex-wrap items-center gap-2 px-5 py-1 text-xs text-slate-600 sm:px-8 lg:px-10">
        {breadcrumbs.map((item, index) => {
          const isCurrent = index === breadcrumbs.length - 1;

          return (
            <li
              key={`${item.href ?? "current"}-${item.label}`}
              className="flex min-w-0 items-center gap-2"
            >
              {index > 0 ? (
                <span aria-hidden="true" className="text-slate-400">
                  /
                </span>
              ) : null}

              {item.href && !isCurrent ? (
                <Link
                  href={item.href}
                  className="transition hover:text-teal-700"
                >
                  {item.label}
                </Link>
              ) : (
                <span
                  aria-current={isCurrent ? "page" : undefined}
                  className={isCurrent ? "truncate text-slate-900" : undefined}
                >
                  {item.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
