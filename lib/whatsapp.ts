/** Builds a wa.me link. The customer taps Send themselves, nothing is sent automatically. */
export function waLink(number: string, text: string): string {
  let n = number.replace(/\D/g, "");
  if (n.startsWith("0")) n = "234" + n.slice(1);
  return `https://wa.me/${n}?text=${encodeURIComponent(text)}`;
}
