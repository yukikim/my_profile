import type { Metadata } from "next";
import { Badge, PageIntro, Section } from "@/components/site-shell";
import { getProfile } from "@/lib/payload/getProfile";

export const metadata: Metadata = {
  title: "About",
  description: "自己紹介、経歴、スキル、活動内容。",
};

export default async function AboutPage() {
  const profile = await getProfile();

  return (
    <>
      <PageIntro
        eyebrow="About"
        title="自己紹介、経歴、スキルをひとつの場所に"
        description={profile.introduction}
      />

      <Section eyebrow="Skills" title="扱える領域">
        <div className="flex flex-wrap gap-3">
          {profile.skills.map((skill) => (
            <Badge key={skill}>{skill}</Badge>
          ))}
        </div>
      </Section>

      <Section eyebrow="Timeline" title="経歴">
        <div className="grid gap-4">
          {profile.timeline.map((item) => (
            <article
              key={item.period}
              className="grid gap-4 rounded-lg border border-stone-200 bg-white p-6 md:grid-cols-[10rem_1fr]"
            >
              <p className="text-sm font-semibold text-[#a9422f]">
                {item.period}
              </p>
              <div>
                <h2 className="text-xl font-semibold text-[#15231f]">
                  {item.title}
                </h2>
                <p className="mt-2 leading-7 text-stone-700">
                  {item.description}
                </p>
              </div>
            </article>
          ))}
        </div>
      </Section>

      <Section eyebrow="Social" title="連絡先と外部リンク">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg border border-stone-200 bg-white p-5">
            <p className="text-sm text-stone-500">Email</p>
            <a
              href={`mailto:${profile.email}`}
              className="mt-2 block break-words font-semibold text-[#15231f]"
            >
              {profile.email}
            </a>
          </div>
          {profile.socials.map((social) => (
            <a
              key={social.label}
              href={social.href}
              target="_blank"
              rel="noreferrer"
              className="rounded-lg border border-stone-200 bg-white p-5 transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <span className="text-sm text-stone-500">{social.label}</span>
              <span className="mt-2 block font-semibold text-[#15231f]">
                Open profile
              </span>
            </a>
          ))}
        </div>
      </Section>
    </>
  );
}
