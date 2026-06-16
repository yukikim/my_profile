import Link from "next/link";
import type {
  ContactFormBlock,
  CtaBlock,
  FaqBlock,
  FeaturesBlock,
  GalleryBlock,
  HeroBlock,
  PageBlock,
  RichTextBlock,
} from "@/lib/content";

export function BlockRenderer({ blocks }: { blocks: PageBlock[] }) {
  return (
    <>
      {blocks.map((block, index) => {
        switch (block.blockType) {
          case "hero":
            return <Hero key={index} block={block} />;
          case "richText":
            return <RichText key={index} block={block} />;
          case "features":
            return <Features key={index} block={block} />;
          case "gallery":
            return <Gallery key={index} block={block} />;
          case "faq":
            return <FAQ key={index} block={block} />;
          case "cta":
            return <CTA key={index} block={block} />;
          case "contactForm":
            return <ContactForm key={index} block={block} />;
          default:
            return null;
        }
      })}
    </>
  );
}

function Hero({ block }: { block: HeroBlock }) {
  return (
    <section className="border-b border-stone-200 bg-[#f8f5ef]">
      <div className="mx-auto w-full max-w-6xl px-5 py-16 sm:px-8 sm:py-24">
        <h1 className="max-w-4xl text-4xl font-semibold leading-tight text-[#15231f] sm:text-6xl">
          {block.title}
        </h1>
        {block.subtitle ? (
          <p className="mt-6 max-w-2xl text-lg leading-8 text-stone-700">
            {block.subtitle}
          </p>
        ) : null}
        {block.ctaText && block.ctaUrl ? (
          <Link
            href={block.ctaUrl}
            className="mt-8 inline-flex min-h-12 items-center justify-center rounded-md bg-[#15231f] px-5 text-sm font-semibold text-white transition hover:bg-[#284139]"
          >
            {block.ctaText}
          </Link>
        ) : null}
      </div>
    </section>
  );
}

function RichText({ block }: { block: RichTextBlock }) {
  return (
    <section className="mx-auto w-full max-w-4xl px-5 py-12 sm:px-8">
      <p className="prose-block">{block.content}</p>
    </section>
  );
}

function Features({ block }: { block: FeaturesBlock }) {
  return (
    <section className="mx-auto w-full max-w-6xl px-5 py-14 sm:px-8">
      <h2 className="text-3xl font-semibold text-[#15231f]">{block.title}</h2>
      <div className="mt-8 grid gap-5 md:grid-cols-3">
        {block.items.map((item) => (
          <article
            key={item.title}
            className="rounded-lg border border-stone-200 bg-white p-6 shadow-sm"
          >
            <h3 className="text-xl font-semibold text-[#15231f]">
              {item.title}
            </h3>
            <p className="mt-3 leading-7 text-stone-700">
              {item.description}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}

function Gallery({ block }: { block: GalleryBlock }) {
  return (
    <section className="mx-auto w-full max-w-6xl px-5 py-14 sm:px-8">
      <div className="grid gap-5 md:grid-cols-3">
        {block.images.map((image) => (
          <figure
            key={image.alt}
            className="overflow-hidden rounded-lg border border-stone-200 bg-white"
          >
            <div
              className="aspect-[4/3]"
              style={{ backgroundColor: image.color }}
              aria-label={image.alt}
            />
            {image.caption ? (
              <figcaption className="p-4 text-sm text-stone-600">
                {image.caption}
              </figcaption>
            ) : null}
          </figure>
        ))}
      </div>
    </section>
  );
}

function FAQ({ block }: { block: FaqBlock }) {
  return (
    <section className="mx-auto w-full max-w-4xl px-5 py-14 sm:px-8">
      <div className="grid gap-4">
        {block.items.map((item) => (
          <details
            key={item.question}
            className="rounded-lg border border-stone-200 bg-white p-5"
          >
            <summary className="cursor-pointer text-lg font-semibold text-[#15231f]">
              {item.question}
            </summary>
            <p className="mt-3 leading-7 text-stone-700">{item.answer}</p>
          </details>
        ))}
      </div>
    </section>
  );
}

function CTA({ block }: { block: CtaBlock }) {
  return (
    <section className="bg-[#2f6f73]">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-5 py-12 text-white sm:px-8 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-3xl font-semibold">{block.title}</h2>
          <p className="mt-3 max-w-xl leading-7 text-stone-100">
            {block.description}
          </p>
        </div>
        <Link
          href={block.buttonUrl}
          className="inline-flex min-h-12 w-fit items-center justify-center rounded-md bg-white px-5 text-sm font-semibold text-[#15231f] transition hover:bg-[#f8f5ef]"
        >
          {block.buttonText}
        </Link>
      </div>
    </section>
  );
}

function ContactForm({ block }: { block: ContactFormBlock }) {
  return (
    <section className="mx-auto w-full max-w-4xl px-5 py-14 sm:px-8">
      <div className="rounded-lg border border-stone-200 bg-white p-6">
        <h2 className="text-3xl font-semibold text-[#15231f]">{block.title}</h2>
        <p className="mt-3 leading-7 text-stone-700">{block.description}</p>
        <Link
          href="/contact"
          className="mt-6 inline-flex min-h-12 items-center justify-center rounded-md bg-[#15231f] px-5 text-sm font-semibold text-white transition hover:bg-[#284139]"
        >
          フォームへ進む
        </Link>
      </div>
    </section>
  );
}
