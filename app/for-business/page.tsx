import { Check, ClipboardList, Globe, Users, Wallet } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { CountUp } from "@/components/CountUp";
import { DashboardMock } from "@/components/DashboardMock";
import { Faq, type FaqItem } from "@/components/Faq";
import { JsonLd } from "@/components/JsonLd";
import { Reveal } from "@/components/Reveal";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Laundry shop software for Nigerian laundries",
  description:
    "LaundryPadi gives laundry shops simple tools to manage orders, customers and payments, plus a professional shop page for new customers. \u20A615,000 one-time setup and \u20A65,000 a month.",
  alternates: { canonical: "/for-business" },
};

const checklist = [
  "Keep track of all orders in one place",
  "Manage customers and pickup dates",
  "Record payments (cash or bank transfer)",
  "A professional shop page for new customers",
];

const features = [
  { Icon: ClipboardList, title: "Orders and receipts", text: "Log walk-in orders, move each one from received to collected and share a receipt." },
  { Icon: Users, title: "Customers", text: "Keep contact details, order history and outstanding balances together." },
  { Icon: Wallet, title: "Payments", text: "Record cash and bank transfers against every order so balances stay accurate." },
  { Icon: Globe, title: "Your shop page", text: "A public page with your prices and hours, and a button for booking requests." },
];

const faqs: FaqItem[] = [
  {
    q: "What do I get with my shop account?",
    a: "An orders dashboard, customer records, your price list, payment records, simple reports and a public shop page where customers can send booking requests. Your data is separate from every other shop.",
  },
  {
    q: "Do I need technical skills to use LaundryPadi?",
    a: "No. If you can use WhatsApp, you can use LaundryPadi. Setting up your shop takes a few minutes: add your details, your services and your prices.",
  },
  {
    q: "Can I stop at any time?",
    a: "Yes. The monthly plan has no long-term contract, and you can export your shop data before you leave.",
  },
];

export default function ForBusinessPage() {
  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "Service",
              name: "LaundryPadi for laundry shops",
              provider: { "@type": "Organization", name: "LaundryPadi", url: site.url },
              areaServed: "Nigeria",
              description: "Order, customer and payment management plus a public shop page for laundry businesses.",
              offers: [
                { "@type": "Offer", name: "One-time setup", price: site.pricing.setup, priceCurrency: "NGN" },
                { "@type": "Offer", name: "Monthly plan", price: site.pricing.monthly, priceCurrency: "NGN" },
              ],
            },
            {
              "@type": "FAQPage",
              mainEntity: faqs.map((f) => ({
                "@type": "Question",
                name: f.q,
                acceptedAnswer: { "@type": "Answer", text: f.a },
              })),
            },
          ],
        }}
      />

      <section className="bg-canvas">
        <div className="container-page grid grid-cols-1 items-start gap-12 py-12 sm:py-16 lg:grid-cols-[1fr_1.05fr] lg:gap-14 lg:py-20">
          <div>
            <p className="animate-rise text-xs font-semibold uppercase tracking-[0.14em] text-ink-soft">
              Built for <span className="text-primary">Nigerian laundry businesses</span>
            </p>
            <h1 className="mt-4 text-4xl font-extrabold leading-[1.08] tracking-tight sm:text-5xl lg:text-[3.5rem]">
              <span className="line-mask">
                <span className="block animate-word-in" style={{ animationDelay: "60ms", animationDuration: "0.9s" }}>
                  Your laundry shop,
                </span>
              </span>
              <span className="line-mask">
                <span className="block animate-word-in" style={{ animationDelay: "180ms", animationDuration: "0.9s" }}>
                  organised.
                </span>
              </span>
            </h1>
            <p className="mt-6 max-w-md animate-rise text-lg leading-relaxed text-ink-soft" style={{ animationDelay: "320ms" }}>
              LaundryPadi gives you simple tools to manage orders, customers and payments, so you can focus on what you do best.
            </p>

            <ul className="mt-7 space-y-3.5">
              {checklist.map((item, i) => (
                <li key={item} className="animate-rise flex items-center gap-3" style={{ animationDelay: `${440 + i * 90}ms` }}>
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-white">
                    <Check aria-hidden="true" className="h-3.5 w-3.5" strokeWidth={3} />
                  </span>
                  <span className="text-ink-soft">{item}</span>
                </li>
              ))}
            </ul>

            <Link href="/register?type=owner" className="btn btn-primary mt-9 animate-rise" style={{ animationDelay: "860ms" }}>
              Create shop account
            </Link>
          </div>

          <div className="space-y-5">
            <div className="animate-rise" style={{ animationDelay: "300ms" }}>
              <DashboardMock />
            </div>

            <Reveal>
              <div className="rounded-lg bg-mint p-4 sm:p-5">
                <p className="text-sm font-semibold">Proposed launch pricing</p>
                <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="rounded-lg bg-white p-4">
                    <p className="font-display text-3xl font-extrabold">
                      <CountUp value={site.pricing.setup} />
                    </p>
                    <p className="mt-1 font-semibold">One-time setup</p>
                    <p className="text-sm text-ink-soft">Get your shop online</p>
                  </div>
                  <div className="rounded-lg bg-white p-4">
                    <p className="font-display text-3xl font-extrabold">
                      <CountUp value={site.pricing.monthly} />
                      <span className="ml-1 text-base font-bold"> / month</span>
                    </p>
                    <p className="mt-1 text-ink-soft">Simple, transparent pricing</p>
                    <p className="text-sm text-ink-soft">No hidden fees</p>
                  </div>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      <section className="border-y border-line bg-white">
        <div className="container-page py-16 sm:py-20">
          <Reveal>
            <h2 className="max-w-xl text-3xl font-bold tracking-tight sm:text-4xl">Everything a laundry shop needs, nothing it doesn&rsquo;t.</h2>
          </Reveal>
          <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {features.map(({ Icon, title, text }, i) => (
              <Reveal key={title} delay={i * 100}>
                <div className="group h-full rounded-lg border border-line bg-canvas p-5 transition duration-300 hover:-translate-y-1 hover:border-primary/40 hover:bg-white hover:shadow-card">
                  <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-mint text-primary transition-colors duration-300 group-hover:bg-primary group-hover:text-white">
                    <Icon aria-hidden="true" className="h-5 w-5" />
                  </span>
                  <h3 className="mt-4 font-display text-lg font-bold">{title}</h3>
                  <p className="mt-1.5 leading-relaxed text-ink-soft">{text}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-canvas">
        <div className="container-page py-16 sm:py-20">
          <Reveal>
            <h2 className="text-3xl font-bold tracking-tight">Frequently asked questions</h2>
          </Reveal>
          <Reveal delay={100} className="mt-8">
            <Faq items={faqs} />
          </Reveal>
        </div>
      </section>
    </>
  );
}
