import Link from "next/link";
import Image from "next/image";
import { submitFormSubmission } from "@/lib/payload/submitForm";
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
    <section className="relative overflow-hidden border-b border-stone-200 bg-[#f8f5ef]">
      {block.backgroundImage?.src ? (
        <Image
          src={block.backgroundImage.src}
          alt={block.backgroundImage.alt}
          fill
          sizes="100vw"
          className="object-cover"
        />
      ) : null}
      {block.backgroundImage?.src ? (
        <div className="absolute inset-0 bg-[#15231f]/68" />
      ) : null}
      <div className="relative mx-auto w-full max-w-6xl px-5 py-16 sm:px-8 sm:py-24">
        <div className="max-w-4xl">
          <h1
            className={`text-4xl font-semibold leading-tight sm:text-6xl ${
              block.backgroundImage?.src ? "text-white" : "text-[#15231f]"
            }`}
          >
            {block.title}
          </h1>
          {block.subtitle ? (
            <p
              className={`mt-6 max-w-2xl text-lg leading-8 ${
                block.backgroundImage?.src ? "text-stone-100" : "text-stone-700"
              }`}
            >
              {block.subtitle}
            </p>
          ) : null}
          {block.ctaText && block.ctaUrl ? (
            <Link
              href={block.ctaUrl}
              className={`mt-8 inline-flex min-h-12 items-center justify-center rounded-md px-5 text-sm font-semibold transition ${
                block.backgroundImage?.src
                  ? "bg-white text-[#15231f] hover:bg-[#f8f5ef]"
                  : "bg-[#15231f] text-white hover:bg-[#284139]"
              }`}
            >
              {block.ctaText}
            </Link>
          ) : null}
        </div>
      </div>
    </section>
  );
}

function RichText({ block }: { block: RichTextBlock }) {
  return (
    <section className="mx-auto w-full max-w-4xl px-5 py-12 sm:px-8">
      {block.html ? (
        <div
          className="rich-text"
          dangerouslySetInnerHTML={{ __html: block.html }}
        />
      ) : (
        <p className="prose-block">{block.content}</p>
      )}
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
            {image.src ? (
              <div className="relative aspect-[4/3]">
                <Image
                  src={image.src}
                  alt={image.alt}
                  fill
                  sizes="(min-width: 768px) 33vw, 100vw"
                  className="object-cover"
                />
              </div>
            ) : (
              <div
                className="aspect-[4/3]"
                style={{ backgroundColor: image.color }}
                aria-label={image.alt}
              />
            )}
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
  const formAction = block.form
    ? submitFormSubmission.bind(null, block.form.id)
    : undefined;

  return (
    <section className="mx-auto w-full max-w-4xl px-5 py-14 sm:px-8">
      <div className="rounded-lg border border-stone-200 bg-white p-6">
        <h2 className="text-3xl font-semibold text-[#15231f]">{block.title}</h2>
        <p className="mt-3 leading-7 text-stone-700">{block.description}</p>
        {block.form && formAction ? (
          <form action={formAction} className="mt-6 grid gap-5">
            {block.form.fields.map((field) => (
              <label key={field.name} className="grid gap-2">
                <span className="text-sm font-semibold text-[#15231f]">
                  {field.label}
                </span>
                {field.type === "textarea" ? (
                  <textarea
                    name={field.name}
                    required={field.required}
                    rows={6}
                    className="rounded-md border border-stone-300 px-3 py-3 outline-none transition focus:border-[#2f6f73] focus:ring-2 focus:ring-[#2f6f73]/20"
                  />
                ) : (
                  <input
                    name={field.name}
                    type={field.type}
                    required={field.required}
                    className="min-h-12 rounded-md border border-stone-300 px-3 outline-none transition focus:border-[#2f6f73] focus:ring-2 focus:ring-[#2f6f73]/20"
                  />
                )}
              </label>
            ))}
            <button
              type="submit"
              className="inline-flex min-h-12 w-fit items-center justify-center rounded-md bg-[#15231f] px-5 text-sm font-semibold text-white transition hover:bg-[#284139]"
            >
              送信する
            </button>
            {block.form.successMessage ? (
              <p className="text-sm leading-6 text-stone-500">
                {block.form.successMessage}
              </p>
            ) : null}
          </form>
        ) : (
          <Link
            href="/contact"
            className="mt-6 inline-flex min-h-12 items-center justify-center rounded-md bg-[#15231f] px-5 text-sm font-semibold text-white transition hover:bg-[#284139]"
          >
            フォームへ進む
          </Link>
        )}
      </div>
    </section>
  );
}
