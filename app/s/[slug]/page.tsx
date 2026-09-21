import { Clock, Info, MapPin } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/JsonLd";
import { Reveal } from "@/components/Reveal";
import { getShopBySlug } from "@/lib/shops";
import { formatNaira, site } from "@/lib/site";
import { waLink } from "@/lib/whatsapp";

export const revalidate = 60;

type Props = { params: { slug: string } };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const shop = await getShopBySlug(params.slug);
  if (!shop) return { title: "Shop not found", robots: { index: false } };
  return {
    title: `${shop.name}${shop.area ? ` in ${shop.area}` : ""}`,
    description: `See prices and opening hours for ${shop.name} and send a booking request in minutes. No account needed.`,
    alternates: { canonical: `/s/${shop.slug}` },
  };
}

export default async function ShopPage({ params }: Props) {
  const shop = await getShopBySlug(params.slug);
  if (!shop) notFound();

  const contactHref = shop.whatsapp
    ? waLink(shop.whatsapp, `Hello ${shop.name}, I found you on LaundryPadi and I have a question.`)
    : null;

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "DryCleaningOrLaundry",
          name: shop.name,
          url: `${site.url}/s/${shop.slug}`,
          image: shop.coverUrl.startsWith("http") ? shop.coverUrl : `${site.url}${shop.coverUrl}`,
          address: { "@type": "PostalAddress", streetAddress: shop.area, addressCountry: "NG" },
        }}
      />

      <section className="bg-white">
        <div className="container-page grid grid-cols-1 items-center gap-8 py-8 sm:py-12 lg:grid-cols-[1.1fr_1fr] lg:gap-14">
          <div className="animate-rise relative aspect-[4/3] overflow-hidden rounded-lg bg-mint sm:aspect-[16/10]">
            {shop.coverUrl ? (
              <Image
                src={shop.coverUrl}
                alt={`Inside ${shop.name}`}
                fill
                priority
                sizes="(min-width: 1024px) 55vw, 100vw"
                className="object-cover object-[80%_50%]"
              />
            ) : (
              <Image src="/images/logo-mark.png" alt="" width={96} height={84} className="absolute inset-0 m-auto opacity-60" />
            )}
          </div>

          <div>
            <h1 className="animate-rise text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl" style={{ animationDelay: "100ms" }}>
              {shop.name}
            </h1>

            <ul className="mt-6 space-y-4">
              <li className="animate-rise flex items-center gap-3" style={{ animationDelay: "200ms" }}>
                <MapPin aria-hidden="true" className="h-5 w-5 shrink-0 text-ink-soft" />
                <span className="text-lg">{shop.area}</span>
              </li>
              <li className="animate-rise flex items-center gap-3 font-semibold" style={{ animationDelay: "270ms" }}>
                <span className="relative flex h-3 w-3 shrink-0" aria-hidden="true">
                  {shop.accepting && <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary/50" />}
                  <span className={`relative inline-flex h-3 w-3 rounded-full ${shop.accepting ? "bg-primary" : "bg-ink-soft"}`} />
                </span>
                <span className={shop.accepting ? "text-primary" : "text-ink-soft"}>
                  {shop.accepting ? "Accepting requests" : "Not accepting requests right now"}
                </span>
              </li>
              <li className="animate-rise flex items-center gap-3 text-ink-soft" style={{ animationDelay: "340ms" }}>
                <Clock aria-hidden="true" className="h-5 w-5 shrink-0" />
                <span>
                  {shop.days}
                  <span className="ml-4">{shop.hours}</span>
                </span>
              </li>
            </ul>

            <div className="mt-8 flex animate-rise flex-col gap-3 sm:flex-row" style={{ animationDelay: "420ms" }}>
              {shop.accepting ? (
                <Link href={`/s/${shop.slug}/book`} className="btn btn-primary sm:min-w-[180px]">
                  Request a booking
                </Link>
              ) : (
                <span aria-disabled="true" className="btn btn-primary sm:min-w-[180px]">
                  Request a booking
                </span>
              )}
              {contactHref && (
                <a href={contactHref} target="_blank" rel="noopener noreferrer" className="btn btn-outline sm:min-w-[160px]">
                  Contact shop
                </a>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-canvas">
        <div className="container-page grid grid-cols-1 gap-5 py-10 sm:py-14 md:grid-cols-2">
          <Reveal>
            <div className="h-full rounded-lg border border-line bg-white p-5 sm:p-6">
              <h2 className="text-lg font-bold">Price list</h2>
              {shop.services.length > 0 ? (
                <ul className="mt-4 divide-y divide-line rounded-lg border border-line">
                  {shop.services.map((s) => (
                    <li key={s.id} className="flex items-center justify-between gap-4 px-4 py-3">
                      <span>
                        {s.name}
                        <span className="ml-2 text-sm text-ink-soft">{s.unit}</span>
                      </span>
                      <span className="font-display font-bold tabular-nums">{formatNaira(s.price)}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-4 rounded-lg bg-canvas p-4 text-ink-soft">
                  This shop has not published prices yet. Contact the shop for a quote.
                </p>
              )}
              <p className="mt-3 text-sm text-ink-soft">Final price may vary based on condition and specific requirements.</p>
            </div>
          </Reveal>

          <Reveal delay={120}>
            <div className="h-full rounded-lg border border-line bg-white p-5 sm:p-6">
              <h2 className="text-lg font-bold">Drop-off information</h2>
              <ul className="mt-5 space-y-5">
                <li className="flex gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-mint text-primary">
                    <MapPin aria-hidden="true" className="h-4 w-4" />
                  </span>
                  <span>
                    <span className="block font-semibold">{shop.area}</span>
                    {shop.landmark && <span className="text-ink-soft">{shop.landmark}</span>}
                  </span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-mint text-primary">
                    <Clock aria-hidden="true" className="h-4 w-4" />
                  </span>
                  <span className="font-semibold">
                    {shop.days}, {shop.hours}
                  </span>
                </li>
                <li className="flex gap-3 text-ink-soft">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-canvas">
                    <Info aria-hidden="true" className="h-4 w-4" />
                  </span>
                  <span>Please drop off your items at the shop. You&rsquo;ll be notified when they are ready for collection.</span>
                </li>
              </ul>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
