"use server";

import { getPayloadClient } from "@/lib/payload/client";

export async function submitFormSubmission(formId: number, formData: FormData) {
  const payload = await getPayloadClient();
  const data = Object.fromEntries(
    Array.from(formData.entries()).filter(([key]) => !key.startsWith("$ACTION_")),
  );

  if (!payload) {
    console.info("Form submission fallback", { data, formId });
    return;
  }

  await payload.create({
    collection: "form-submissions",
    data: {
      data,
      form: formId,
    },
  });
}
