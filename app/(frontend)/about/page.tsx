import type { Metadata } from "next";
import Image from "next/image";
import { PageIntro, Section } from "@/components/site-shell";
import { getProfile } from "@/lib/payload/getProfile";
import { ScrollingBackgroundOrbsSub } from "@/components/scrolling-background-orbs-sub";
import { Breadcrumbs } from "@/components/breadcrumbs";

// Payloadの更新を、300秒経過後に反映します。
export const revalidate = 300;

export const metadata: Metadata = {
  title: "About",
  description: "自己紹介、経歴、スキル、活動内容。",
};

export default async function AboutPage() {
  const profile = await getProfile();

  return (
    <>
      <ScrollingBackgroundOrbsSub />
      <Breadcrumbs items={[{ label: "About" }]} />
      <PageIntro eyebrow="About" title="自己紹介" description="" />

      <Section eyebrow="self-introduction" title="">
        <div className="flex flex-col gap-8 md:flex-row md:items-start md:gap-12">
          {profile.avatar?.src ? (
            <div className="relative size-72 shrink-0 overflow-hidden rounded-full bg-teal-50/50 shadow-xs mx-auto">
              <Image
                src={profile.avatar.src}
                alt={profile.avatar.alt || profile.name}
                fill
                sizes="(max-width: 640px) 144px, 192px"
                className="object-cover"
                priority
              />
            </div>
          ) : null}
          <div className="flex-1">
            {profile.introductionHtml ? (
              <div
                className="rich-text text-base leading-relaxed"
                dangerouslySetInnerHTML={{ __html: profile.introductionHtml }}
              />
            ) : (
              <p className="prose-block">{profile.introduction}</p>
            )}
          </div>
        </div>
      </Section>

    </>
  );
}
