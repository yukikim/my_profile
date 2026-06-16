export async function getSiteSettings() {
  return {
    siteDescription:
      "プロフィール、実績、記事、問い合わせをCMSで管理する個人プロフィールサイト。",
    siteName: "Marco Green",
    siteUrl: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
  };
}
