import Link from "next/link";
import { MobileMenu } from "@/components/mobile-menu";
import { getFooter } from "@/lib/payload/getFooter";
import { getHeader } from "@/lib/payload/getHeader";
import { getProfile } from "@/lib/payload/getProfile";
import Image from "next/image";

export async function SiteHeader() {
  const [header, profile] = await Promise.all([getHeader(), getProfile()]);

  console.log("header.ctaButton", header.ctaButton);

  const navigation = header.navigation

  return (
    <header className="sticky top-0 z-20 bg-white/70 backdrop-blur">
      <div className="mx-auto flex min-h-14 w-full max-w-7xl items-center justify-between gap-4 px-5 py-3 sm:px-8 lg:px-10">
        <Link
          href="/"
          className="flex items-center gap-2.5"
          aria-label="Go home"
        >
          <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="#00bba7"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="#00bba7"
              className="size-8 inline-block align-[-14px]"
          >
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"
            />
          </svg>
          <span className="text-xs font-bold tracking-[0.08em] text-teal-700 sm:text-sm">
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
        <div className="flex flex-row gap-8 itmes-end justify-end">
            <Link href="https://nextjs.org/" target="_blank" rel="noopener noreferrer" className="block">
              <Image src={'/images/nextjs-logotype-dark-background.png'} alt="Next.js Icon" width={60} height={60} className="inline" />
            </Link>
            <Link href="https://vercel.com/" target="_blank" rel="noopener noreferrer" className="block">
              <Image src={'/images/vercel-logotype-dark.png'} alt="Vercel Icon" width={60} height={60} className="inline" />
            </Link>
            <Link href="https://tailwindcss.com/" target="_blank" rel="noopener noreferrer" className="block">
              <Image src={'/images/tailwindcss-logo-white.png'} alt="Tailwind CSS Icon" width={80} height={80} className="inline" />
            </Link>
            <Link href="https://github.com/yukikim/yukikim" target="_blank" rel="noopener noreferrer" className="block">
              <Image src={'/images/GitHub_Invertocat_White.png'} alt="GitHub Icon" width={24} height={24} className="inline" />
            </Link>
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
    <section className="border-b border-teal-100 bg-teal-50/30">
      <div className="mx-auto w-full max-w-7xl px-5 py-14 sm:px-8 sm:py-20 lg:px-10">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-teal-700">
          {eyebrow}
        </p>
        <h1 className="mt-4 max-w-4xl text-4xl font-bold leading-tight tracking-tight text-slate-700 sm:text-6xl">
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
      <h2 className="mt-3 text-2xl font-bold leading-tight tracking-tight text-slate-700 sm:text-3xl">
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
