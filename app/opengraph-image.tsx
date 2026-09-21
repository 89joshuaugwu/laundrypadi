import { ogSize, renderOg } from "@/lib/og";

export const runtime = "nodejs";
export const alt = "LaundryPadi: fresh clothes, less hassle";
export const size = ogSize;
export const contentType = "image/png";

export default function Image() {
  return renderOg({ title: "Fresh clothes. Less hassle.", subtitle: "Book and track your laundry in Enugu and beyond." });
}
