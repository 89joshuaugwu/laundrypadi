import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { BookingWizard } from "@/components/BookingWizard";
import { getShopBySlug } from "@/lib/shops";

export const revalidate = 60;

type Props = { params: { slug: string } };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const shop = await getShopBySlug(params.slug);
  if (!shop) return { title: "Shop not found", robots: { index: false } };
  return {
    title: `Book laundry at ${shop.name}`,
    description: `Send a booking request to ${shop.name}. No account needed.`,
    alternates: { canonical: `/s/${shop.slug}/book` },
  };
}

export default async function BookPage({ params }: Props) {
  const shop = await getShopBySlug(params.slug);
  if (!shop) notFound();
  if (!shop.accepting) redirect(`/s/${shop.slug}`);

  return (
    <BookingWizard
      shop={{ slug: shop.slug, name: shop.name, area: shop.area, whatsapp: shop.whatsapp, services: shop.services }}
    />
  );
}
