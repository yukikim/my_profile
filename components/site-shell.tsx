import Link from "next/link";
import { getFooter } from "@/lib/payload/getFooter";
import { getHeader } from "@/lib/payload/getHeader";
import { getProfile } from "@/lib/payload/getProfile";

export async function SiteHeader() {
  const [header, profile] = await Promise.all([getHeader(), getProfile()]);
  // CMS設定にまだ導線がない環境でも、Phase 6の公開ページへ到達できるよう補完します。
  const navigation = header.navigation.some(
    (item) => item.href === "/engineering-notes",
  )
    ? header.navigation
    : [
        ...header.navigation,
        { href: "/engineering-notes", label: "Engineering Notes" },
      ];

  return (
    <header className="sticky top-0 z-20 border-b border-stone-200 bg-[#f8f5ef]/92 backdrop-blur">
      <div className="mx-auto flex min-h-16 w-full max-w-6xl items-center justify-between gap-4 px-5 py-3 sm:px-8">
        <Link href="/" className="flex items-center gap-3" aria-label="Go home">
          <span className="grid size-10 place-items-center rounded-md bg-[#15231f] text-sm font-semibold text-[#f8f5ef]">
            MG
          </span>
          <span className="hidden text-sm font-semibold text-[#15231f] sm:block">
            {profile.name}
          </span>
        </Link>
        <nav aria-label="Primary navigation">
          <ul className="flex flex-wrap items-center justify-end gap-1 text-sm font-medium text-stone-700">
            {navigation.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="rounded-md px-3 py-2 transition hover:bg-white hover:text-[#15231f]"
                >
                  {item.label}
                </Link>
              </li>
            ))}
            {header.ctaButton ? (
              <li>
                <Link
                  href={header.ctaButton.href}
                  className="rounded-md bg-[#15231f] px-3 py-2 text-white transition hover:bg-[#284139]"
                >
                  {header.ctaButton.label}
                </Link>
              </li>
            ) : null}
          </ul>
        </nav>
      </div>
    </header>
  );
}

export async function SiteFooter() {
  const [footer, profile] = await Promise.all([getFooter(), getProfile()]);

  return (
    <footer className="border-t border-stone-200 bg-[#15231f] text-[#f8f5ef]">
      <div className="mx-auto grid w-full max-w-6xl gap-8 px-5 py-10 sm:px-8 md:grid-cols-[1.4fr_1fr]">
        <div>
          <p className="text-base font-semibold">{profile.name}</p>
          <p className="mt-3 max-w-xl text-sm leading-6 text-stone-300">
            {profile.tagline}
          </p>
        </div>
        <div className="flex flex-wrap items-start gap-6 md:justify-end">
          {footer.navigation.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm text-stone-300 transition hover:text-white"
            >
              {item.label}
            </Link>
          ))}
          {footer.snsLinks.map((social) => (
            <a
              key={social.label}
              href={social.href}
              target="_blank"
              rel="noreferrer"
              className="text-sm text-stone-300 transition hover:text-white"
            >
              {social.label}
            </a>
          ))}
        </div>
        <p className="text-xs text-stone-400 md:col-span-2">
          {footer.copyright}
        </p>
      </div>
    </footer>
  );
}

export function PageIntro({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <section className="border-b border-stone-200 bg-[#f8f5ef]">
      <div className="mx-auto w-full max-w-6xl px-5 py-14 sm:px-8 sm:py-20">
        <p className="text-sm font-semibold uppercase text-[#a9422f]">
          {eyebrow}
        </p>
        <h1 className="mt-4 max-w-4xl text-4xl font-semibold leading-tight text-[#15231f] sm:text-6xl">
          {title}
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-8 text-stone-700">
          {description}
        </p>
      </div>
    </section>
  );
}

export function Section({
  eyebrow,
  title,
  children,
}: {
  eyebrow?: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mx-auto w-full max-w-6xl px-5 py-14 sm:px-8 sm:py-18">
      {eyebrow ? (
        <p className="text-sm font-semibold uppercase text-[#a9422f]">
          {eyebrow}
        </p>
      ) : null}
      <h2 className="mt-3 text-3xl font-semibold leading-tight text-[#15231f] sm:text-4xl">
        {title}
      </h2>
      <div className="mt-8">{children}</div>
    </section>
  );
}

export function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-md border border-stone-300 bg-white px-3 py-1 text-sm font-medium text-stone-700">
      {children}
    </span>
  );
}
