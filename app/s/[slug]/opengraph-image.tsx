import { ogSize, renderOg } from "@/lib/og";
import { getShopBySlug } from "@/lib/shops";

export const runtime = "nodejs";
export const alt = "Laundry shop on LaundryPadi";
export const size = ogSize;
export const contentType = "image/png";

export default async function Image({ params }: { params: { slug: string } }) {
  const shop = await getShopBySlug(params.slug);
  return renderOg({
    badge: "Book on LaundryPadi",
    title: shop?.name ?? "Laundry shop",
    subtitle: shop?.area || "Send a booking request in minutes.",
  });
}
