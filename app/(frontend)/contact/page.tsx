import type { Metadata } from "next";
import { PageIntro, Section } from "@/components/site-shell";
import { getPayloadClient } from "@/lib/payload/client";
import { getProfile } from "@/lib/payload/getProfile";
import { sendContactEmail } from "@/lib/email/sendContactEmail";

export const metadata: Metadata = {
  title: "Contact",
  description: "問い合わせフォーム、SNS、外部連絡先。",
};

async function submitContact(formData: FormData) {
  "use server";

  const payload = await getPayloadClient();

  const getText = (name: string, maxLength: number) => {
    const value = formData.get(name);

    if (typeof value !== "string") {
      throw new Error(`${name}が入力されていません。`);
    }

    const normalized = value.trim();

    if (!normalized || normalized.length > maxLength) {
      throw new Error(`${name}の入力内容が不正です。`);
    }

    return normalized;
  };
  const submission = {
    subject: getText("subject", 200),
    name: getText("name", 100),
    email: getText("email", 254),
    message: getText("message", 5000),
  };

  if (!payload) {
    console.info("Contact submission fallback", submission);
    return;
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
    return;
  }

  // nodemailerでメール送信
  const notificationEmails =
    form.notificationEmails
      ?.map((notification) => notification.email)
      .filter(Boolean) ?? [];

  if (notificationEmails.length === 0) {
    throw new Error("問い合わせ通知先が設定されていません。");
  }

  await payload.create({
    collection: "form-submissions",
    data: {
      data: submission,
      form: form.id,
    },
  });

  await sendContactEmail(submission, notificationEmails);
}

export default async function ContactPage() {
  const profile = await getProfile();

  return (
    <>
      <PageIntro
        eyebrow="Contact"
        title="CMS構築、プロフィールサイト制作の相談"
        description="実績紹介、記事運用、問い合わせ導線まで含めたプロフィールサイトの初期構築を相談できます。"
      />

      <Section title="お問い合わせフォーム">
        <div className="grid gap-8 lg:grid-cols-[1fr_20rem]">
          <form
            action={submitContact}
            className="grid gap-5 rounded-lg border border-stone-200 bg-white p-6"
          >
            <label className="grid gap-2">
              <span className="text-sm font-semibold text-[#15231f]">
                お名前
              </span>
              <input
                name="name"
                required
                className="min-h-12 rounded-md border border-stone-300 px-3 outline-none transition focus:border-[#2f6f73] focus:ring-2 focus:ring-[#2f6f73]/20"
              />
            </label>
            <label className="grid gap-2">
              <span className="text-sm font-semibold text-[#15231f]">件名</span>
              <input
                name="subject"
                required
                className="min-h-12 rounded-md border border-stone-300 px-3 outline-none transition focus:border-[#2f6f73] focus:ring-2 focus:ring-[#2f6f73]/20"
              />
            </label>
            <label className="grid gap-2">
              <span className="text-sm font-semibold text-[#15231f]">
                メールアドレス
              </span>
              <input
                name="email"
                type="email"
                required
                className="min-h-12 rounded-md border border-stone-300 px-3 outline-none transition focus:border-[#2f6f73] focus:ring-2 focus:ring-[#2f6f73]/20"
              />
            </label>
            <label className="grid gap-2">
              <span className="text-sm font-semibold text-[#15231f]">
                相談内容
              </span>
              <textarea
                name="message"
                required
                rows={7}
                className="rounded-md border border-stone-300 px-3 py-3 outline-none transition focus:border-[#2f6f73] focus:ring-2 focus:ring-[#2f6f73]/20"
              />
            </label>
            <button
              type="submit"
              className="inline-flex min-h-12 w-fit items-center justify-center rounded-md bg-[#15231f] px-5 text-sm font-semibold text-white transition hover:bg-[#284139]"
            >
              送信する
            </button>
          </form>
          <aside className="h-fit rounded-lg border border-stone-200 bg-white p-6">
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
          </aside>
        </div>
      </Section>
    </>
  );
}
