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
      <div className="mx-auto my-20 px-4 flex flex-col lg:flex-row gap-4 justify-between w-full max-w-7xl">
          <div id="footer-left">
              <div>
                  <p className="text-xl font-bold tracking-tight">{profile.name}</p>
                  <p className="mt-3 max-w-xl text-sm leading-6 text-slate-300">
                      {profile.tagline}
                  </p>
              </div>
          </div>
          <div id="footer-right" className="flex flex-col gap-2 lg:gap-6 items-end">
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

              <div className="flex flex-row gap-8 items-center justify-end mt-8">
                  <Link href="https://nextjs.org/" target="_blank" rel="noopener noreferrer" className="block">
                      <Image src={'/images/nextjs-logotype-dark-background.png'} alt="Next.js Icon" width={60} height={60} className="inline w-15 h-auto" />
                  </Link>
                  <Link href="https://vercel.com/" target="_blank" rel="noopener noreferrer" className="block">
                      <Image src={'/images/vercel-logotype-dark.png'} alt="Vercel Icon" width={60} height={60} className="inline w-15 h-auto" />
                  </Link>
                  <Link href="https://tailwindcss.com/" target="_blank" rel="noopener noreferrer" className="block">
                      <Image src={'/images/tailwindcss-logo-white.png'} alt="Tailwind CSS Icon" width={80} height={80} className="inline w-25 h-auto" />
                  </Link>
                  <Link href="https://payloadcms.com/" target="_blank" rel="noopener noreferrer" className="block">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 239 54"
                      className="h-4 w-auto"
                    >
                    <g clip-path="url(#clip0_5500_287)">
                      <path d="M22.2356 44.1333L6.97565 35.3304C6.79045 35.2193 6.66699 35.0218 6.66699 34.7996V21.194C6.66699 20.9594 6.92626 20.8112 7.1238 20.9223L24.8407 31.1451C25.0876 31.2932 25.3963 31.108 25.3963 30.8241V24.1941C25.3963 23.9348 25.2605 23.6879 25.0259 23.5521L3.71623 11.2552C3.53103 11.1441 3.28411 11.1441 3.09892 11.2552L0.308657 12.8726C0.123463 12.9837 0 13.1812 0 13.4035V38.6763C0 38.8985 0.123463 39.0961 0.308657 39.2072L22.1986 51.8498C22.3838 51.9609 22.6307 51.9609 22.8159 51.8498L41.1995 41.232C41.4464 41.0838 41.4464 40.7381 41.1995 40.59L35.4709 37.2812C35.2363 37.1453 34.9647 37.1453 34.7301 37.2812L22.8653 44.1333C22.6801 44.2445 22.4332 44.2445 22.248 44.1333H22.2356Z" fill="white"/>
                      <path d="M44.7062 12.862L22.8163 0.231775C22.6311 0.120658 22.3842 0.120658 22.199 0.231775L10.6305 6.91111C10.3836 7.05926 10.3836 7.40496 10.6305 7.55312L16.3098 10.8372C16.5444 10.973 16.816 10.973 17.0506 10.8372L22.236 7.84943C22.4212 7.73831 22.6681 7.73831 22.8533 7.84943L38.1133 16.6523C38.2985 16.7634 38.422 16.961 38.422 17.1832V30.8505C38.422 31.1098 38.5578 31.3567 38.7924 31.4925L44.4717 34.7643C44.7186 34.9125 45.0272 34.7273 45.0272 34.4433V13.4053C45.0272 13.183 44.9038 12.9855 44.7186 12.8744L44.7062 12.862Z" fill="white"/>
                      <path d="M238.752 11.8405C238.752 14.2357 236.924 15.9395 234.677 15.9395C232.43 15.9395 230.591 14.2234 230.591 11.8405C230.591 9.45769 232.43 7.75391 234.677 7.75391C236.924 7.75391 238.752 9.47004 238.752 11.8405ZM238.184 11.8405C238.184 9.76635 236.628 8.2848 234.677 8.2848C232.727 8.2848 231.171 9.76635 231.171 11.8405C231.171 13.9147 232.727 15.4086 234.677 15.4086C236.628 15.4086 238.184 13.927 238.184 11.8405ZM232.961 13.9394V9.60585H234.949C235.998 9.60585 236.616 10.0874 236.616 11.0257C236.616 11.68 236.245 12.0874 235.789 12.285L236.764 13.9517H235.665L234.776 12.4455H233.986V13.9517H232.974L232.961 13.9394ZM234.801 11.643C235.369 11.643 235.591 11.4454 235.591 11.0257C235.591 10.6059 235.356 10.4207 234.801 10.4207H233.974V11.643H234.801Z" fill="white"/>
                      <path d="M67.5586 30.8147V44.3091H60.8916V7.67773H76.0281C84.6952 7.67773 89.7325 11.6285 89.7325 19.2709C89.7325 26.9132 84.7076 30.8147 76.0775 30.8147H67.5586ZM75.4602 25.4811C80.4851 25.4811 83.0038 23.4316 83.0038 19.2709C83.0038 15.1102 80.4851 13.0607 75.4602 13.0607H67.5586V25.4811H75.4602Z" fill="white"/>
                      <path d="M106.103 40.2102C104.868 43.1857 101.584 44.8771 97.4354 44.8771C92.3611 44.8771 88.6572 42.0498 88.6572 37.3336C88.6572 32.0987 92.7562 29.9505 98.0527 29.3332L105.856 28.4566V27.222C105.856 24.0366 103.905 22.5057 100.929 22.5057C97.954 22.5057 96.3119 24.0984 96.102 26.5059H89.7931C90.361 20.913 94.7193 17.6289 101.127 17.6289C108.214 17.6289 112.263 20.9624 112.263 27.7405V37.8027C112.263 40.2102 112.362 42.2227 112.782 44.3215H106.473C106.214 42.8894 106.115 41.4943 106.115 40.2226L106.103 40.2102ZM105.843 34.1976V32.6049L100.04 33.2716C97.2749 33.6297 95.1637 34.247 95.1637 36.9632C95.1637 39.0127 96.5959 40.2967 99.2133 40.2967C102.596 40.2967 105.831 38.2966 105.831 34.1853L105.843 34.1976Z" fill="white"/>
                      <path d="M111.599 18.2461H118.266L125.501 37.9014H125.599L132.476 18.2461H138.995L128.834 44.7782C126.365 51.2971 123.34 53.8157 117.858 53.8651C116.982 53.8651 115.759 53.7663 114.833 53.6058V48.6303C115.599 48.7908 116.019 48.7908 116.574 48.7908C119.241 48.7908 120.364 47.8648 121.76 44.272L111.599 18.2584V18.2461Z" fill="white"/>
                      <path d="M140.081 44.3091V7.67773H146.649V44.3091H140.081Z" fill="white"/>
                      <path d="M161.477 44.9278C153.785 44.9278 148.291 39.7424 148.291 31.2852C148.291 22.828 153.785 17.6426 161.477 17.6426C169.169 17.6426 174.663 22.8774 174.663 31.2852C174.663 39.693 169.169 44.9278 161.477 44.9278ZM161.477 40.0511C165.687 40.0511 168.094 36.767 168.094 31.2729C168.094 25.7788 165.687 22.4947 161.477 22.4947C157.267 22.4947 154.859 25.8282 154.859 31.2729C154.859 36.7176 157.217 40.0511 161.477 40.0511Z" fill="white"/>
                      <path d="M192.837 40.2102C191.602 43.1857 188.318 44.8771 184.17 44.8771C179.095 44.8771 175.392 42.0498 175.392 37.3336C175.392 32.0987 179.491 29.9505 184.787 29.3332L192.59 28.4566V27.222C192.59 24.0366 190.639 22.5057 187.664 22.5057C184.688 22.5057 183.046 24.0984 182.836 26.5059H176.527C177.095 20.913 181.454 17.6289 187.874 17.6289C194.96 17.6289 199.01 20.9624 199.01 27.7405V37.8027C199.01 40.2102 199.109 42.2227 199.529 44.3215H193.22C192.96 42.8894 192.862 41.4943 192.862 40.2226L192.837 40.2102ZM192.578 34.1976V32.6049L186.775 33.2716C184.009 33.6297 181.898 34.247 181.898 36.9632C181.898 39.0127 183.33 40.2967 185.948 40.2967C189.331 40.2967 192.565 38.2966 192.565 34.1853L192.578 34.1976Z" fill="white"/>
                      <path d="M220.381 40.1608C219.097 42.7782 215.961 44.9388 212.01 44.9388C205.183 44.9388 200.516 39.3953 200.516 31.2962C200.516 23.197 205.183 17.6535 212.01 17.6535C216.06 17.6535 219.035 19.9129 220.27 22.5303V7.67773H226.838V44.3091H220.368V40.1484L220.381 40.1608ZM220.443 30.8147C220.443 25.7403 218.035 22.4439 213.874 22.4439C209.714 22.4439 207.146 25.9379 207.146 31.2715C207.146 36.6051 209.615 40.0991 213.874 40.0991C218.134 40.0991 220.443 36.8149 220.443 31.7283V30.8023V30.8147Z" fill="white"/>
                    </g>
                    <defs>
                      <clipPath id="clip0_5500_287">
                        <rect width="238.752" height="53.7063" fill="white" transform="translate(0 0.146484)"/>
                      </clipPath>
                    </defs>
                  </svg>
                </Link>
                  <Link href="https://github.com/yukikim/my_profile" target="_blank" rel="noopener noreferrer" className="block">
                      <Image src={'/images/GitHub_Invertocat_White.png'} alt="GitHub Icon" width={24} height={24} className="inline w-6 h-auto" />
                  </Link>

              </div>
              <p className="text-xs text-slate-400 md:col-span-2">
                  {footer.copyright}
              </p>
          </div>
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
