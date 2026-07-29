import assert from "node:assert/strict";
import test from "node:test";
import { CONTACT_HONEYPOT_FIELD } from "../../lib/contact/constants";
import {
  createFixedWindowRateLimiter,
  getContactClientKey,
  isValidEmail,
  parseContactFormData,
  sanitizeMultiline,
  sanitizeSingleLine,
} from "../../lib/contact/security";

function validFormData() {
  const formData = new FormData();
  formData.set(CONTACT_HONEYPOT_FIELD, "");
  formData.set("name", "山田 太郎");
  formData.set("subject", "制作の相談");
  formData.set("email", "taro@example.com");
  formData.set("message", "プロフィールサイトについて相談したいです。");
  return formData;
}

test("正規の問い合わせを正規化して受け付ける", () => {
  const formData = validFormData();
  formData.set("name", "  山田\u0000 太郎  ");
  formData.set("subject", "相談\r\nInjected");
  formData.set("message", "1行目\r\n2行目\u0000");

  const result = parseContactFormData(formData);

  assert.equal(result.success, true);
  if (result.success) {
    assert.deepEqual(result.data, {
      name: "山田 太郎",
      subject: "相談 Injected",
      email: "taro@example.com",
      message: "1行目\n2行目",
    });
  }
});

test("Honeypotへの入力またはフィールド欠落をspamとして扱う", () => {
  const filled = validFormData();
  filled.set(CONTACT_HONEYPOT_FIELD, "https://spam.example");
  assert.deepEqual(parseContactFormData(filled), {
    success: false,
    reason: "spam",
  });

  const missing = validFormData();
  missing.delete(CONTACT_HONEYPOT_FIELD);
  assert.deepEqual(parseContactFormData(missing), {
    success: false,
    reason: "spam",
  });
});

test("不正なメールアドレス、空文字、上限超過を拒否する", () => {
  const invalidEmail = validFormData();
  invalidEmail.set("email", "not-an-email");
  assert.deepEqual(parseContactFormData(invalidEmail), {
    success: false,
    reason: "invalid",
  });

  const emptyMessage = validFormData();
  emptyMessage.set("message", " \u0000 ");
  assert.deepEqual(parseContactFormData(emptyMessage), {
    success: false,
    reason: "invalid",
  });

  const longSubject = validFormData();
  longSubject.set("subject", "a".repeat(201));
  assert.deepEqual(parseContactFormData(longSubject), {
    success: false,
    reason: "invalid",
  });
});

test("汎用フォーム向けメール形式検証を行う", () => {
  assert.equal(isValidEmail("valid@example.com"), true);
  assert.equal(isValidEmail("not-an-email"), false);
});

test("単一行と複数行の制御文字を用途別に除去する", () => {
  assert.equal(sanitizeSingleLine("a\r\nb\u202Ec"), "a bc");
  assert.equal(sanitizeMultiline("a\r\nb\tc\u0000"), "a\nb\tc");
});

test("同じ送信元を固定時間枠内で制限する", () => {
  const limiter = createFixedWindowRateLimiter({
    maxRequests: 2,
    windowMs: 1_000,
  });

  assert.equal(limiter.consume("client", 0), true);
  assert.equal(limiter.consume("client", 100), true);
  assert.equal(limiter.consume("client", 200), false);
  assert.equal(limiter.consume("client", 1_000), true);
});

test("転送ヘッダーから妥当な送信元だけを取り出す", () => {
  assert.equal(
    getContactClientKey(
      new Headers({ "x-forwarded-for": "203.0.113.10, 10.0.0.1" }),
    ),
    "203.0.113.10",
  );
  assert.equal(
    getContactClientKey(new Headers({ "x-forwarded-for": "not-an-ip" })),
    null,
  );
});
