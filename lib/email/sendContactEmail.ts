import nodemailer from "nodemailer";

type ContactSubmission = {
  subject: string;
  name: string;
  email: string;
  message: string;
};

export async function sendContactEmail(
  submission: ContactSubmission,
  recipients: string[],
) {
  const gmailUser = process.env.GMAIL_USER;
  const gmailAppPassword = process.env.GMAIL_APP_PASSWORD;

  if (!gmailUser || !gmailAppPassword) {
    throw new Error("Gmailの環境変数が設定されていません。");
  }

  if (recipients.length === 0) {
    throw new Error("問い合わせ通知先が設定されていません。");
  }

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: gmailUser,
      pass: gmailAppPassword,
    },
  });

  await transporter.sendMail({
    from: `"Portfolio Contact" <${gmailUser}>`,
    to: recipients,
    replyTo: submission.email,
    subject: `[お問い合わせ] ${submission.subject.replace(/[\r\n]/g, " ")}`,
    text: [
      "プロフィールサイトからお問い合わせがありました。",
      "",
      `お名前: ${submission.name}`,
      `メールアドレス: ${submission.email}`,
      `件名: ${submission.subject}`,
      "",
      "お問い合わせ内容:",
      submission.message,
    ].join("\n"),
  });
}