import type { Metadata } from "next";
import { headers } from "next/headers";
import { PageIntro, Section } from "@/components/site-shell";
import {
  contactRateLimiter,
  getContactClientKey,
  parseContactFormData,
} from "@/lib/contact/security";
import { saveContactSubmission } from "@/lib/contact/submission";
import { getPayloadClient } from "@/lib/payload/client";
import { sendContactEmail } from "@/lib/email/sendContactEmail";
import { ContactForm, type ContactFormState } from "./ContactForm";
import { ScrollingBackgroundOrbsSub } from "@/components/scrolling-background-orbs-sub";
import { Breadcrumbs } from "@/components/breadcrumbs";

export const metadata: Metadata = {
  title: "Contact",
  description: "問い合わせフォーム、SNS、外部連絡先。",
};

async function submitContact(
  _previousState: ContactFormState,
  formData: FormData,
): Promise<ContactFormState> {
  "use server";

  const parsed = parseContactFormData(formData);

  if (!parsed.success) {
    if (parsed.reason === "spam") {
      // Honeypotの存在をbotへ知らせず、保存もメール送信もしません。
      return {
        status: "success",
        message:
          "お問い合わせありがとうございます。内容を確認して返信いたします。",
      };
    }

    return {
      status: "error",
      message: "入力内容を確認して、もう一度送信してください。",
    };
  }

  const clientKey = getContactClientKey(await headers());

  if (clientKey && !contactRateLimiter.consume(clientKey)) {
    return {
      status: "error",
      message:
        "短時間に送信できる回数を超えました。時間をおいてお試しください。",
    };
  }

  return saveContactSubmission(parsed.data, {
    getPayload: getPayloadClient,
    sendEmail: sendContactEmail,
  });
}

export default function ContactPage() {
  return (
    <>
      <ScrollingBackgroundOrbsSub />
      <Breadcrumbs items={[{ label: "Contact" }]} />
      <PageIntro
        eyebrow="Contact"
        title="お問い合わせフォーム"
        description="ご意見・ご相談など、お気軽にお問い合わせください。"
      />

      <Section title="">
        <div className="grid gap-8 lg:grid-cols-[1fr_20rem]">
          <ContactForm action={submitContact} />
          {/* <aside className="h-fit rounded-lg border border-stone-200 bg-white p-6">
            <h2 className="text-xl font-semibold text-[#15231f]">連絡先</h2>
            <a
              href={`mailto:${profile.email}`}
              className="mt-4 block break-words text-sm font-semibold text-[#2f6f73]"
            >
              {profile.email}
            </a>
            <div className="mt-6 grid gap-3">
              {profile.socials.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-md border border-stone-200 px-3 py-2 text-sm font-medium text-stone-700 transition hover:bg-[#f8f5ef] hover:text-[#15231f]"
                >
                  {social.label}
                </a>
              ))}
            </div>
          </aside> */}
        </div>
      </Section>
    </>
  );
}
