import type { Metadata } from "next";
import { SiteFooter, SiteHeader } from "@/components/site-shell";
import "../globals.css";

export const metadata: Metadata = {
  title: {
    default: "Marco Green | Profile CMS Portfolio",
    template: "%s | Marco Green",
  },
  description:
    "プロフィール、実績、記事、問い合わせをCMSで管理する個人プロフィールサイト。",
};

export default function FrontendLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" className="h-full antialiased">
      <body className="min-h-full">
        <div className="flex min-h-screen flex-col">
          <SiteHeader />
          <main className="flex-1">{children}</main>
          <SiteFooter />
        </div>
      </body>
    </html>
  );
}
