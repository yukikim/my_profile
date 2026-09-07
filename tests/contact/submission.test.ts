import assert from "node:assert/strict";
import test from "node:test";
import { saveContactSubmission } from "../../lib/contact/submission";

const submission = {
  name: "テスト",
  subject: "相談",
  email: "test@example.com",
  message: "お問い合わせ内容",
};

type Dependencies = Parameters<typeof saveContactSubmission>[1];

function setup(failure?: "init" | "find" | "create" | "email" | "missing") {
  const calls: string[] = [];
  const dependencies: Dependencies = {
    async getPayload() {
      if (failure === "init") throw new Error("Database unavailable");
      return {
        async find() {
          calls.push("find");
          if (failure === "find") throw new Error("Query failed");
          return {
            docs:
              failure === "missing"
                ? []
                : [
                    {
                      id: 1,
                      notificationEmails: [{ email: "owner@example.com" }],
                      successMessage: "受付完了",
                    },
                  ],
          };
        },
        async create(options: unknown) {
          calls.push("create");
          assert.deepEqual(options, {
            collection: "form-submissions",
            overrideAccess: true,
            data: { data: submission, form: 1 },
          });
          if (failure === "create") throw new Error("Insert failed");
          return { id: 42 };
        },
      } as unknown as NonNullable<
        Awaited<ReturnType<Dependencies["getPayload"]>>
      >;
    },
    async sendEmail(data, recipients) {
      calls.push("email");
      assert.deepEqual(data, submission);
      assert.deepEqual(recipients, ["owner@example.com"]);
      if (failure === "email") throw new Error("SMTP authentication failed");
    },
  };
  return { dependencies, calls };
}

test("保存後に通知し、CMSの完了メッセージを返す", async () => {
  const { dependencies, calls } = setup();
  assert.deepEqual(await saveContactSubmission(submission, dependencies), {
    status: "success",
    message: "受付完了",
  });
  assert.deepEqual(calls, ["find", "create", "email"]);
});

test("通知失敗でも保存済みの問い合わせを成功として返す", async (t) => {
  const log = t.mock.method(console, "error", () => {});
  const { dependencies, calls } = setup("email");
  assert.equal(
    (await saveContactSubmission(submission, dependencies)).status,
    "success",
  );
  assert.deepEqual(calls, ["find", "create", "email"]);
  assert.equal(log.mock.calls[0].arguments[1].submissionId, 42);
});

for (const failure of ["init", "find", "create", "missing"] as const) {
  test(`${failure}失敗をフォーム内のエラーに変換し、通知しない`, async (t) => {
    t.mock.method(console, "error", () => {});
    const { dependencies, calls } = setup(failure);
    const result = await saveContactSubmission(submission, dependencies);
    assert.equal(result.status, "error");
    assert.ok(result.message.includes("時間をおいて"));
    assert.ok(!calls.includes("email"));
  });
}

test("Payloadが未設定の場合は成功を返さない", async () => {
  const { dependencies, calls } = setup();
  dependencies.getPayload = async () => null;
  assert.equal(
    (await saveContactSubmission(submission, dependencies)).status,
    "error",
  );
  assert.deepEqual(calls, []);
});
