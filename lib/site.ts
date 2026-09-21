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

/** Where people land after signing in. */
export const postAuthPath = { customer: "/account/orders", owner: "/owner" } as const;

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

/** Today's date in Nigeria (YYYY-MM-DD), whatever the device or server time zone is. */
export function todayLagos(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Lagos" }).format(new Date());
}

export function formatDateTime(iso: string): string {
  return new Intl.DateTimeFormat("en-NG", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "Africa/Lagos",
  }).format(new Date(iso));
}

export function greeting(): string {
  const h = Number(new Intl.DateTimeFormat("en-GB", { hour: "numeric", hour12: false, timeZone: "Africa/Lagos" }).format(new Date()));
  return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
}

/** 08031234567 -> 0803 *** 4567 */
export function maskPhone(p: string): string {
  const d = p.replace(/\D/g, "");
  return d.length >= 8 ? `${d.slice(0, 4)} *** ${d.slice(-4)}` : p;
}

/** 08031234567 -> 0803 123 4567 */
export function prettyPhone(p: string): string {
  const d = p.replace(/\D/g, "");
  return d.length === 11 ? `${d.slice(0, 4)} ${d.slice(4, 7)} ${d.slice(7)}` : p;
}
