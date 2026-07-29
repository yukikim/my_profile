import { isIP } from "node:net";
import { z } from "zod";
import { CONTACT_HONEYPOT_FIELD } from "./constants";

export type ContactSubmission = {
  subject: string;
  name: string;
  email: string;
  message: string;
};

export type ContactSubmissionParseResult =
  | {
      success: true;
      data: ContactSubmission;
    }
  | {
      success: false;
      reason: "invalid" | "spam";
    };

const controlCharacters = /\p{Cc}/gu;
const directionalFormattingCharacters = /[\u202A-\u202E\u2066-\u2069]/gu;

export function sanitizeSingleLine(value: string) {
  return value
    .normalize("NFC")
    .replace(controlCharacters, " ")
    .replace(directionalFormattingCharacters, "")
    .replace(/\s+/gu, " ")
    .trim();
}

export function sanitizeMultiline(value: string) {
  return value
    .normalize("NFC")
    .replace(/\r\n?/gu, "\n")
    .replace(controlCharacters, (character) =>
      character === "\n" || character === "\t" ? character : "",
    )
    .replace(directionalFormattingCharacters, "")
    .trim();
}

const singleLine = (maxLength: number) =>
  z
    .string()
    .max(maxLength)
    .transform(sanitizeSingleLine)
    .pipe(z.string().min(1).max(maxLength));

const multiline = (maxLength: number) =>
  z
    .string()
    .max(maxLength)
    .transform(sanitizeMultiline)
    .pipe(z.string().min(1).max(maxLength));

const contactSubmissionSchema = z.object({
  subject: singleLine(200),
  name: singleLine(100),
  email: z
    .string()
    .max(254)
    .transform(sanitizeSingleLine)
    .pipe(z.email().max(254)),
  message: multiline(5_000),
});

export function isValidEmail(value: string) {
  return z.email().max(254).safeParse(value).success;
}

export function parseContactFormData(
  formData: FormData,
): ContactSubmissionParseResult {
  const honeypot = formData.get(CONTACT_HONEYPOT_FIELD);

  // 正規のフォームは必ず空文字を送ります。欠落や入力があればbot扱いにします。
  if (honeypot !== "") {
    return { success: false, reason: "spam" };
  }

  const parsed = contactSubmissionSchema.safeParse({
    subject: formData.get("subject"),
    name: formData.get("name"),
    email: formData.get("email"),
    message: formData.get("message"),
  });

  if (!parsed.success) {
    return { success: false, reason: "invalid" };
  }

  return {
    success: true,
    data: parsed.data,
  };
}

type RateLimitBucket = {
  count: number;
  resetAt: number;
};

type FixedWindowRateLimiterOptions = {
  maxRequests: number;
  windowMs: number;
};

export function createFixedWindowRateLimiter({
  maxRequests,
  windowMs,
}: FixedWindowRateLimiterOptions) {
  const buckets = new Map<string, RateLimitBucket>();

  return {
    consume(key: string, now = Date.now()) {
      for (const [bucketKey, bucket] of buckets) {
        if (bucket.resetAt <= now) {
          buckets.delete(bucketKey);
        }
      }

      const current = buckets.get(key);

      if (!current) {
        buckets.set(key, {
          count: 1,
          resetAt: now + windowMs,
        });
        return true;
      }

      if (current.count >= maxRequests) {
        return false;
      }

      current.count += 1;
      return true;
    },
  };
}

export function getContactClientKey(requestHeaders: Headers) {
  const forwardedFor = requestHeaders.get("x-forwarded-for");
  const candidate =
    forwardedFor?.split(",")[0]?.trim() ||
    requestHeaders.get("x-real-ip")?.trim();

  if (
    !candidate ||
    candidate.length > 64 ||
    isIP(candidate) === 0
  ) {
    return null;
  }

  return candidate;
}

const rateLimiterGlobal = globalThis as typeof globalThis & {
  contactRateLimiter?: ReturnType<typeof createFixedWindowRateLimiter>;
};

export const contactRateLimiter =
  rateLimiterGlobal.contactRateLimiter ??
  createFixedWindowRateLimiter({
    maxRequests: 5,
    windowMs: 10 * 60 * 1_000,
  });

rateLimiterGlobal.contactRateLimiter = contactRateLimiter;
