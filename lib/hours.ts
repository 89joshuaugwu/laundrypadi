export const DAYS = ["Mon \u2013 Sat", "Mon \u2013 Fri", "Mon \u2013 Sun", "Tue \u2013 Sun", "Every day"];

export const TIMES: string[] = (() => {
  const out: string[] = [];
  for (let m = 6 * 60; m <= 23 * 60; m += 30) {
    const h24 = Math.floor(m / 60);
    const h = h24 % 12 === 0 ? 12 : h24 % 12;
    out.push(`${h}:${m % 60 === 0 ? "00" : "30"} ${h24 < 12 ? "AM" : "PM"}`);
  }
  return out;
})();

export function splitHours(hours: string): [string, string] {
  const [a, b] = hours.split(" \u2013 ");
  return [TIMES.includes(a) ? a : "8:00 AM", TIMES.includes(b) ? b : "7:00 PM"];
}
