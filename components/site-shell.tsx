import Link from "next/link";
import { MobileMenu } from "@/components/mobile-menu";
import { getFooter } from "@/lib/payload/getFooter";
import { getHeader } from "@/lib/payload/getHeader";
import { getProfile } from "@/lib/payload/getProfile";

export async function SiteHeader() {
  const [header, profile] = await Promise.all([getHeader(), getProfile()]);

  // CMS設定にまだ導線がない環境でも、Phase 6の公開ページへ到達できるよう補完します。
  // const navigation = header.navigation.some(
  //   (item) => item.href === "/engineering-notes",
  // )
  //   ? header.navigation
  //   : [
  //       ...header.navigation,
  //       { href: "/engineering-notes", label: "Dev Notes" },
  //     ];

  console.log("header.ctaButton", header.ctaButton);

  const navigation = header.navigation

  return (
    <header className="sticky top-0 z-20 border-b border-teal-100 bg-white/92 backdrop-blur">
      <div className="mx-auto flex min-h-[5.25rem] w-full max-w-7xl items-center justify-between gap-4 px-5 py-3 sm:px-8 lg:px-10">
        <Link
          href="/"
          className="flex items-center gap-2.5"
          aria-label="Go home"
        >
          <span
            className="size-4 rounded-full bg-teal-500"
            aria-hidden="true"
          />
          <span className="text-xs font-semibold tracking-[0.08em] text-slate-950 sm:text-sm">
            {profile.name}
          </span>
        </Link>
        {/* PC向けメニュー */}
        <nav aria-label="Primary navigation" className="hidden md:block">
          <ul className="flex flex-wrap items-center justify-end gap-2 text-xs font-medium tracking-wide text-slate-700">
            {navigation.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="rounded-full px-3 py-2 transition hover:bg-teal-50 hover:text-teal-700"
                >
                  {item.label}
                </Link>
              </li>
            ))}
            {header.ctaButton?.label.trim() && header.ctaButton.href.trim() ? (
              <li>
                <Link
                  href={header.ctaButton.href}
                  className="rounded-full bg-teal-500 px-4 py-2.5 font-semibold text-white transition hover:bg-teal-600"
                >
                  {header.ctaButton.label}
                </Link>
              </li>
            ) : null}
          </ul>
        </nav>
        <MobileMenu navigation={navigation} />
      </div>
    </header>
  );
}

export async function SiteFooter() {
  const [footer, profile] = await Promise.all([getFooter(), getProfile()]);

  return (
    <footer className="bg-slate-700 text-white">
      <div className="mx-auto grid w-full max-w-7xl gap-8 px-5 py-12 sm:px-8 md:grid-cols-[1.4fr_1fr] lg:px-10 lg:py-16">
        <div>
          <p className="text-xl font-bold tracking-tight">{profile.name}</p>
          <p className="mt-3 max-w-xl text-sm leading-6 text-slate-300">
            {profile.tagline}
          </p>
        </div>
        <div className="flex flex-wrap items-start gap-6 md:justify-end">
          {footer.navigation.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm text-slate-300 transition hover:text-teal-300"
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
              className="text-sm text-slate-300 transition hover:text-teal-300"
            >
              {social.label}
            </a>
          ))}
        </div>
        <p className="text-xs text-slate-400 md:col-span-2">
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
    <section className="border-b border-teal-100 bg-teal-50">
      <div className="mx-auto w-full max-w-7xl px-5 py-14 sm:px-8 sm:py-20 lg:px-10">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-teal-700">
          {eyebrow}
        </p>
        <h1 className="mt-4 max-w-4xl text-4xl font-bold leading-tight tracking-tight text-slate-950 sm:text-6xl">
          {title}
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-700">
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
    <section className="mx-auto w-full max-w-7xl px-5 py-14 sm:px-8 sm:py-18 lg:px-10">
      {eyebrow ? (
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-teal-700">
          {eyebrow}
        </p>
      ) : null}
      <h2 className="mt-3 text-3xl font-bold leading-tight tracking-tight text-slate-950 sm:text-4xl">
        {title}
      </h2>
      <div className="mt-8">{children}</div>
    </section>
  );
}

export function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full bg-teal-100 px-3 py-1 text-sm font-medium text-teal-800">
      {children}
    </span>
  );
}
