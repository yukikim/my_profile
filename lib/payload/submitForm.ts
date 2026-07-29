"use server";

import { headers } from "next/headers";
import { CONTACT_HONEYPOT_FIELD } from "@/lib/contact/constants";
import {
  contactRateLimiter,
  getContactClientKey,
  isValidEmail,
  sanitizeMultiline,
  sanitizeSingleLine,
} from "@/lib/contact/security";
import { getPayloadClient } from "@/lib/payload/client";

export async function submitFormSubmission(formId: number, formData: FormData) {
  if (formData.get(CONTACT_HONEYPOT_FIELD) !== "") {
    return;
  }

  const clientKey = getContactClientKey(await headers());

  if (clientKey && !contactRateLimiter.consume(clientKey)) {
    return;
  }

  const payload = await getPayloadClient();

  if (!payload) {
    console.info("Form submission fallback", { formId });
    return;
  }

  const form = await payload.findByID({
    collection: "forms",
    id: formId,
    overrideAccess: true,
  });
  const data: Record<string, string> = {};

  for (const field of form.fields) {
    const rawValue = formData.get(field.name);

    if (rawValue === null && !field.required) {
      continue;
    }

    if (typeof rawValue !== "string") {
      return;
    }

    const maxLength =
      field.type === "textarea" ? 5_000 : field.type === "email" ? 254 : 500;

    if (rawValue.length > maxLength) {
      return;
    }

    const value =
      field.type === "textarea"
        ? sanitizeMultiline(rawValue)
        : sanitizeSingleLine(rawValue);

    if (!value && field.required) {
      return;
    }

    if (field.type === "email" && value && !isValidEmail(value)) {
      return;
    }

    if (value) {
      data[field.name] = value;
    }
  }

  // form-submissionsコレクションで定義されているフィールドでDBに保存する
  await payload.create({
    collection: "form-submissions",
    // 公開REST APIのcreate権限は閉じ、信頼済みServer Actionからのみ保存する。
    overrideAccess: true,
    data: {
      data, // 既存のforms レコードのID
      form: formId, // 名前、メールアドレス、本文などの送信内容
    },
  });
}
