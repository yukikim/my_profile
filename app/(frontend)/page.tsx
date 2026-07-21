import Link from "next/link";
import { PostCard, WorkCard } from "@/components/content-cards";
import { Badge, Section } from "@/components/site-shell";
import { faqs } from "@/lib/content";
import { getPosts } from "@/lib/payload/getPosts";
import { getProfile } from "@/lib/payload/getProfile";
import { getFeaturedWorks } from "@/lib/payload/getWorks";

export default async function Home() {
  const [featuredWorks, latestPosts, profile] = await Promise.all([
    getFeaturedWorks(),
    getPosts().then((posts) => posts.slice(0, 2)),
    getProfile(),
  ]);

  return (
    <>
      <section className="bg-[#f8f5ef]">
        <div className="mx-auto grid min-h-[calc(100vh-4rem)] w-full max-w-6xl items-center gap-10 px-5 py-14 sm:px-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <p className="text-sm font-semibold uppercase text-[#a9422f]">
              Profile CMS Portfolio
            </p>
            <h1 className="mt-5 text-5xl font-semibold leading-tight text-[#15231f] sm:text-7xl">
              {profile.name}
            </h1>
            <p className="mt-5 max-w-2xl text-xl leading-9 text-stone-700">
              {profile.tagline}
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/works"
                className="inline-flex min-h-12 items-center justify-center rounded-md bg-[#15231f] px-5 text-sm font-semibold text-white transition hover:bg-[#284139]"
              >
                実績を見る
              </Link>
              <Link
                href="/contact"
                className="inline-flex min-h-12 items-center justify-center rounded-md border border-[#15231f] px-5 text-sm font-semibold text-[#15231f] transition hover:bg-white"
              >
                相談する
              </Link>
            </div>
          </div>
          <div className="rounded-lg border border-stone-200 bg-white p-6 shadow-sm">
            <div className="aspect-[4/3] rounded-md bg-[#e7ddd0] p-5">
              <div className="grid h-full grid-cols-3 gap-3">
                <div className="rounded-md bg-[#15231f]" />
                <div className="rounded-md bg-[#2f6f73]" />
                <div className="rounded-md bg-[#a9422f]" />
                <div className="col-span-2 rounded-md bg-white p-4">
                  <p className="text-sm font-semibold text-[#15231f]">
                    {profile.title}
                  </p>
                  <p className="mt-3 text-sm leading-6 text-stone-600">
                    {profile.location}
                  </p>
                </div>
                <div className="rounded-md bg-[#f5c45e]" />
              </div>
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              {profile.skills.slice(0, 6).map((skill) => (
                <Badge key={skill}>{skill}</Badge>
              ))}
            </div>
          </div>
        </div>
      </section>

      <Section eyebrow="Profile" title="更新し続けられる個人サイトを設計します">
        <div className="grid gap-8 md:grid-cols-[0.9fr_1.1fr]">
          <p className="text-lg leading-9 text-stone-700">
            {profile.introduction}
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              ["CMS", "プロフィール、実績、記事、メディアを管理"],
              ["Blocks", "Hero、FAQ、CTAなどをページ単位で配置"],
              ["Deploy", "Vercel と PostgreSQL を想定した構成"],
              ["SEO", "ページごとのタイトル、説明文、公開状態を管理"],
            ].map(([title, text]) => (
              <div
                key={title}
                className="rounded-lg border border-stone-200 bg-white p-5"
              >
                <h3 className="font-semibold text-[#15231f]">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-stone-600">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </Section>

      <Section eyebrow="Featured Works" title="主要実績">
        <div className="grid gap-6 md:grid-cols-2">
          {featuredWorks.map((work) => (
            <WorkCard key={work.slug} work={work} />
          ))}
        </div>
      </Section>

      <Section eyebrow="Latest Posts" title="最新記事">
        <div className="grid gap-6 md:grid-cols-2">
          {latestPosts.map((post) => (
            <PostCard key={post.slug} post={post} />
          ))}
        </div>
      </Section>

      <Section eyebrow="FAQ" title="よくある質問">
        <div className="grid gap-4">
          {faqs.map((faq) => (
            <details
              key={faq.question}
              className="rounded-lg border border-stone-200 bg-white p-5"
            >
              <summary className="cursor-pointer text-lg font-semibold text-[#15231f]">
                {faq.question}
              </summary>
              <p className="mt-3 leading-7 text-stone-700">{faq.answer}</p>
            </details>
          ))}
        </div>
      </Section>

      <section className="bg-[#2f6f73]">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-5 py-12 text-white sm:px-8 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase text-[#f5c45e]">
              Contact
            </p>
            <h2 className="mt-2 text-3xl font-semibold">
              プロフィールサイトやCMS構築を相談する
            </h2>
          </div>
          <Link
            href="/contact"
            className="inline-flex min-h-12 w-fit items-center justify-center rounded-md bg-white px-5 text-sm font-semibold text-[#15231f] transition hover:bg-[#f8f5ef]"
          >
            お問い合わせへ
          </Link>
        </div>
      </section>
    </>
  );
}
