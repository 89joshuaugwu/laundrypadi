export const site = {
  name: "LaundryPadi",
  tagline: "Fresh clothes. Brighter days.",
  url: (process.env.NEXT_PUBLIC_SITE_URL ?? "https://laundrypadi.vercel.app").replace(/\/$/, ""),
  supportWhatsapp: process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP ?? "",
  supportEmail: process.env.NEXT_PUBLIC_SUPPORT_EMAIL ?? "",
  pricing: { setup: 15000, monthly: 5000 },
} as const;

export const navLinks = [
  { href: "/#how-it-works", label: "How it works" },
  { href: "/for-business", label: "For shop owners" },
  { href: "/track", label: "Track order" },
] as const;

/**
 * Where people land after signing in. The customer account area and the shop
 * owner dashboard are the next build steps; switch these two paths then.
 */
export const postAuthPath = { customer: "/", owner: "/" } as const;

export function formatNaira(amount: number): string {
  return "\u20A6" + new Intl.NumberFormat("en-NG").format(amount);
}

/** Deterministic (UTC) date formatting so server and client always agree. */
export function formatDate(iso: string, withYear = false): string {
  const d = new Date(iso.length === 10 ? `${iso}T00:00:00Z` : iso);
  return new Intl.DateTimeFormat("en-NG", {
    month: "short",
    day: "numeric",
    ...(withYear ? { year: "numeric", weekday: "short" } : {}),
    timeZone: "UTC",
  }).format(d);
}
