import type { Payload } from "payload";
import type { ContactSubmission } from "./security";

type SubmissionDependencies = {
  getPayload: () => Promise<Pick<Payload, "find" | "create"> | null>;
  sendEmail: (
    submission: ContactSubmission,
    recipients: string[],
  ) => Promise<unknown>;
};

type SubmissionResult = {
  status: "success" | "error";
  message: string;
};

export async function saveContactSubmission(
  submission: ContactSubmission,
  dependencies: SubmissionDependencies,
): Promise<SubmissionResult> {
  const unavailable: SubmissionResult = {
    status: "error",
    message: "現在お問い合わせを送信できません。時間をおいてお試しください。",
  };

  let form;
  let submissionId;
  try {
    const payload = await dependencies.getPayload();
    if (!payload) return unavailable;

    const forms = await payload.find({
      collection: "forms",
      limit: 1,
      where: { name: { equals: "Contact" } },
    });
    form = forms.docs[0];
    if (!form) {
      console.error("Contact form is not configured");
      return unavailable;
    }

    const saved = await payload.create({
      collection: "form-submissions",
      // 公開REST APIでは保存不可。このServer Action経由でのみ保存します。
      overrideAccess: true,
      data: { data: submission, form: form.id },
    });
    submissionId = saved.id;
  } catch (error) {
    console.error("Contact submission storage failed", error);
    return unavailable;
  }

  // 保存済みの問い合わせは管理画面から確認できます。
  // 通知失敗を送信失敗として返すと、再送による重複登録につながります。
  try {
    const recipients =
      form.notificationEmails
        ?.map((notification) => notification.email)
        .filter(Boolean) ?? [];
    await dependencies.sendEmail(submission, recipients);
  } catch (error) {
    console.error("Contact notification failed; submission saved", {
      submissionId,
      error,
    });
  }

  return {
    status: "success",
    message:
      form.successMessage ??
      "お問い合わせありがとうございます。内容を確認して返信いたします。",
  };
}
