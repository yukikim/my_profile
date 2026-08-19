import type { Metadata } from "next";
import { headers } from "next/headers";
import { PageIntro, Section } from "@/components/site-shell";
import {
  contactRateLimiter,
  getContactClientKey,
  parseContactFormData,
} from "@/lib/contact/security";
import { getPayloadClient } from "@/lib/payload/client";
import { getProfile } from "@/lib/payload/getProfile";
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

  const submission = parsed.data;
  const payload = await getPayloadClient();

  if (!payload) {
    console.info("Contact submission fallback", submission);
    return {
      status: "error",
      message: "現在お問い合わせを送信できません。時間をおいてお試しください。",
    };
  }

  const forms = await payload.find({
    collection: "forms",
    limit: 1,
    where: {
      name: {
        equals: "Contact",
      },
    },
  });
  const form = forms.docs[0];

  if (!form) {
    console.info("Contact form is not configured", submission);
    return {
      status: "error",
      message: "お問い合わせフォームが設定されていません。",
    };
  }

  // nodemailerでメール送信
  const notificationEmails =
    form.notificationEmails
      ?.map((notification) => notification.email)
      .filter(Boolean) ?? [];

  if (notificationEmails.length === 0) {
    return {
      status: "error",
      message: "問い合わせ通知先が設定されていません。",
    };
  }

  await payload.create({
    collection: "form-submissions",
    // 公開REST APIはcreate不可にし、この信頼済みServer Actionだけが保存します。
    overrideAccess: true,
    data: {
      data: submission,
      form: form.id,
    },
  });

  await sendContactEmail(submission, notificationEmails);

  return {
    status: "success",
    message:
      form.successMessage ??
      "お問い合わせありがとうございます。内容を確認して返信いたします。",
  };
}

export default async function ContactPage() {
  const profile = await getProfile();

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
