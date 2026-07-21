"use server";

import { getPayloadClient } from "@/lib/payload/client";

export async function submitFormSubmission(formId: number, formData: FormData) {
  const payload = await getPayloadClient();
  const data = Object.fromEntries(
    Array.from(formData.entries()).filter(
      ([key]) => !key.startsWith("$ACTION_"),
    ),
  );

  if (!payload) {
    console.info("Form submission fallback", { data, formId });
    return;
  }

  // form-submissionsコレクションで定義されているフィールドでDBに保存する
  await payload.create({
    collection: "form-submissions",
    data: {
      data, // 既存のforms レコードのID
      form: formId, // 名前、メールアドレス、本文などの送信内容
    },
  });
}
