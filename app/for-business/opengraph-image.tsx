import { ogSize, renderOg } from "@/lib/og";

export const runtime = "nodejs";
export const alt = "LaundryPadi for laundry shop owners";
export const size = ogSize;
export const contentType = "image/png";

export default function Image() {
  return renderOg({
    badge: "For shop owners",
    title: "Your laundry shop, organised.",
    subtitle: "Orders, customers and payments in one place.",
  });
}
