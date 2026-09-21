/**
 * Small in-memory limiter, one bucket per warm serverless instance. It slows casual abuse.
 * For hard guarantees add Cloudflare Turnstile or Upstash Ratelimit on the same routes.
 */
const hits = new Map<string, { n: number; reset: number }>();

export function rateLimit(key: string, limit = 8, windowMs = 60_000): boolean {
  const now = Date.now();
  if (hits.size > 5000) {
    hits.forEach((v, k) => {
      if (v.reset < now) hits.delete(k);
    });
  }
  const h = hits.get(key);
  if (!h || h.reset < now) {
    hits.set(key, { n: 1, reset: now + windowMs });
    return true;
  }
  h.n += 1;
  return h.n <= limit;
}

export function clientIp(req: Request): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
}
