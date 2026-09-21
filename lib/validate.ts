/** Normalises Nigerian numbers to the local 11-digit form (0803 123 4567 -> 08031234567). */
export function normalizePhone(input: string): string {
  let d = input.replace(/\D/g, "");
  if (d.startsWith("234") && d.length === 13) d = "0" + d.slice(3);
  else if (d.length === 10 && !d.startsWith("0")) d = "0" + d;
  return d;
}

export function isValidNgPhone(input: string): boolean {
  return /^0[789][01]\d{8}$/.test(normalizePhone(input));
}

export function cleanText(value: unknown, max: number, keepNewlines = false): string {
  if (typeof value !== "string") return "";
  const re = keepNewlines ? /[\u0000-\u0009\u000B-\u001F\u007F]/g : /[\u0000-\u001F\u007F]/g;
  return value.replace(re, " ").trim().slice(0, max);
}

export function isIsoDate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(new Date(`${value}T00:00:00Z`).getTime());
}

export function normalizeRef(input: string): string {
  return input.toUpperCase().replace(/\s+/g, "").replace(/^([A-Z]{2})(\d)/, "$1-$2");
}

/** Whole number within [min, max], or null. */
export function toInt(value: unknown, min: number, max: number): number | null {
  const n = typeof value === "string" && value.trim() !== "" ? Number(value) : value;
  if (typeof n !== "number" || !Number.isInteger(n) || n < min || n > max) return null;
  return n;
}

export function isCloudinaryUrl(value: string): boolean {
  return value === "" || /^https:\/\/res\.cloudinary\.com\/[A-Za-z0-9_-]+\/image\/upload\/.+/.test(value);
}
