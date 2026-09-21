import { ArrowRight, Check, MapPin, Store } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { JsonLd } from "@/components/JsonLd";
import { Reveal } from "@/components/Reveal";
import { RotatingText } from "@/components/RotatingText";
import { TrackerDemo } from "@/components/TrackerDemo";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: { absolute: "LaundryPadi | Book and track your laundry in Enugu" },
  description:
    "Find a trusted laundry near you, send a booking request in minutes and track your order with just a reference and phone number. No account needed.",
  alternates: { canonical: "/" },
};

const steps = [
  { title: "Choose your shop", text: "Find a laundry near you" },
  { title: "Book your laundry", text: "Send a request in minutes" },
  { title: "Collect when ready", text: "We\u2019ll keep you updated" },
];

const items = ["shirts", "trousers", "duvets", "school uniforms", "bedsheets", "curtains"];

const perks = [
  "Book and track without creating an account",
  "The shop confirms the final price and collection date",
  "Pay the shop directly, in cash or by bank transfer",
];

export default function HomePage() {
  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "Organization",
              name: "LaundryPadi",
              url: site.url,
              logo: `${site.url}/images/logo.png`,
              slogan: site.tagline,
              areaServed: "Enugu, Nigeria",
            },
            { "@type": "WebSite", name: "LaundryPadi", url: site.url },
          ],
        }}
      />

      {/* ---------- Hero ---------- */}
      <section className="relative overflow-hidden bg-canvas">
        <div className="container-page relative z-10 pb-4 pt-12 sm:pt-16 lg:py-28">
          <div className="max-w-xl">
            <p
              className="animate-rise text-xs font-semibold uppercase tracking-[0.14em] text-primary"
              style={{ animationDelay: "0ms" }}
            >
              Cleaner days for a brighter you
            </p>

            <h1 className="mt-4 text-[2.4rem] font-extrabold leading-[1.04] tracking-tight text-ink sm:text-6xl lg:text-[4.25rem]">
              <span className="line-mask">
                <span className="block animate-word-in" style={{ animationDelay: "80ms", animationDuration: "0.9s" }}>
                  Fresh clothes.
                </span>
              </span>
              <span className="line-mask">
                <span className="block animate-word-in" style={{ animationDelay: "220ms", animationDuration: "0.9s" }}>
                  Less hassle.
                </span>
              </span>
            </h1>

            <p className="mt-6 max-w-md animate-rise text-lg leading-relaxed text-ink-soft" style={{ animationDelay: "380ms" }}>
              Find a trusted laundry near you, book with ease and get back to what matters.
            </p>

            <p
              className="mt-5 flex animate-rise flex-wrap items-center gap-x-2 font-display text-base font-semibold text-primary sm:text-lg"
              style={{ animationDelay: "480ms" }}
            >
              <span className="relative flex h-2.5 w-2.5" aria-hidden="true">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary/50" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-primary" />
              </span>
              Book a wash for your <RotatingText words={items} className="min-w-[8.5ch]" />
            </p>

            <div className="mt-8 flex animate-rise flex-col gap-3 sm:flex-row" style={{ animationDelay: "580ms" }}>
              <Link href="/track" className="btn btn-primary sm:min-w-[172px]">
                Track my order
              </Link>
              <Link href="/for-business" className="btn btn-outline sm:min-w-[172px]">
                Run a laundry shop?
              </Link>
            </div>

            <p className="mt-6 flex animate-rise items-center gap-2 text-sm text-ink-soft" style={{ animationDelay: "680ms" }}>
              <MapPin aria-hidden="true" className="h-4 w-4" />
              Serving Enugu and beyond
            </p>
          </div>
        </div>

        {/* Image: sits behind the copy on large screens, below it on phones */}
        <div className="relative mt-8 h-64 overflow-hidden sm:h-80 lg:absolute lg:inset-y-0 lg:right-0 lg:mt-0 lg:h-auto lg:w-[62%]">
          <Image
            src="/images/hero-towels.jpg"
            alt="A neat stack of freshly folded green and cream towels beside a plant on a bright counter"
            fill
            priority
            sizes="(min-width: 1024px) 62vw, 100vw"
            className="animate-kenburns object-cover object-[75%_50%]"
          />
          <div aria-hidden="true" className="absolute inset-0 hidden bg-gradient-to-r from-canvas via-canvas/55 via-30% to-transparent to-60% lg:block" />
          <div aria-hidden="true" className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-canvas to-transparent lg:hidden" />

          <div className="absolute bottom-5 right-4 hidden w-[320px] animate-rise sm:block lg:bottom-10 lg:right-8" style={{ animationDelay: "1000ms" }}>
            <div className="animate-drift">
              <TrackerDemo compact />
            </div>
          </div>
        </div>
      </section>

      {/* ---------- How it works ---------- */}
      <section id="how-it-works" className="border-y border-line bg-white">
        <div className="container-page py-16 sm:py-20">
          <Reveal>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">How it works</h2>
          </Reveal>

          <ol className="mt-10 grid grid-cols-1 gap-8 md:grid-cols-3 md:gap-6">
            {steps.map((step, i) => (
              <li key={step.title}>
                <Reveal delay={i * 140} className="relative flex items-center gap-4">
                  <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-citrus/60 font-display text-xl font-bold text-ink">
                    {i + 1}
                  </span>
                  <div>
                    <h3 className="font-display text-lg font-bold">{step.title}</h3>
                    <p className="text-ink-soft">{step.text}</p>
                  </div>
                  {i < steps.length - 1 && (
                    <span
                      aria-hidden="true"
                      className="draw-line absolute -right-3 top-1/2 hidden h-0 w-6 -translate-y-1/2 border-t-2 border-dotted border-primary/40 md:block"
                    />
                  )}
                </Reveal>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ---------- Tracking ---------- */}
      <section className="bg-canvas">
        <div className="container-page grid grid-cols-1 items-center gap-10 py-16 sm:py-20 lg:grid-cols-2 lg:gap-16">
          <Reveal>
            <h2 className="text-3xl font-bold leading-tight tracking-tight sm:text-4xl">
              Know where your laundry is, without calling the shop.
            </h2>
            <p className="mt-4 max-w-lg text-lg leading-relaxed text-ink-soft">
              Every order moves through four clear steps: received, washing, ready and collected. Track it with your
              order reference and phone number.
            </p>
            <ul className="mt-6 space-y-3">
              {perks.map((perk) => (
                <li key={perk} className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-white">
                    <Check aria-hidden="true" className="h-3.5 w-3.5" strokeWidth={3} />
                  </span>
                  <span className="text-ink-soft">{perk}</span>
                </li>
              ))}
            </ul>
            <Link href="/track" className="btn btn-primary mt-8">
              Track my order
            </Link>
          </Reveal>
          <Reveal delay={150}>
            <TrackerDemo />
          </Reveal>
        </div>
      </section>

      {/* ---------- Owner CTA ---------- */}
      <section className="bg-canvas pb-16 sm:pb-20">
        <div className="container-page">
          <Reveal>
            <div className="flex flex-col gap-5 rounded-lg bg-mint p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
              <div className="flex items-start gap-4 sm:items-center">
                <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-white text-primary">
                  <Store aria-hidden="true" className="h-7 w-7" />
                </span>
                <div>
                  <h2 className="text-lg font-bold sm:text-xl">Are you a laundry shop owner?</h2>
                  <p className="mt-1 text-ink-soft">Join LaundryPadi and run your business more efficiently.</p>
                </div>
              </div>
              <Link
                href="/for-business"
                className="group inline-flex items-center gap-2 self-start font-display font-semibold text-primary underline decoration-primary/40 underline-offset-4 transition-colors hover:decoration-primary sm:self-auto"
              >
                Learn more
                <ArrowRight aria-hidden="true" className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
