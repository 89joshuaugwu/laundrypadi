import { createHmac, timingSafeEqual } from "crypto";

const BASE = "https://api.paystack.co";

export class BillingError extends Error {
  constructor(message: string, public status = 502) {
    super(message);
  }
}

function secret(): string {
  const s = process.env.PAYSTACK_SECRET_KEY;
  if (!s) throw new BillingError("Billing is not set up yet. Add PAYSTACK_SECRET_KEY to the server environment.", 503);
  return s;
}

export const isLiveKey = () => (process.env.PAYSTACK_SECRET_KEY ?? "").startsWith("sk_live");

/** Server-to-server call to Paystack. Returns `data`, or throws BillingError with Paystack's message. */
export async function ps<T>(path: string, init: { method?: "GET" | "POST"; body?: unknown } = {}): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${BASE}${path}`, {
      method: init.method ?? "GET",
      headers: { Authorization: `Bearer ${secret()}`, "Content-Type": "application/json" },
      body: init.body === undefined ? undefined : JSON.stringify(init.body),
      cache: "no-store",
      signal: AbortSignal.timeout(15_000),
    });
  } catch {
    throw new BillingError("We could not reach Paystack. Please try again.", 504);
  }
  const json = (await res.json().catch(() => null)) as { status?: boolean; message?: string; data?: T } | null;
  if (!res.ok || !json?.status) throw new BillingError(json?.message ?? "Paystack could not complete that request.", 502);
  return json.data as T;
}

/** Paystack signs the raw webhook body with HMAC-SHA512 using your secret key. */
export function verifySignature(raw: string, signature: string | null, key = process.env.PAYSTACK_SECRET_KEY ?? ""): boolean {
  if (!signature || !key) return false;
  const expected = createHmac("sha512", key).update(raw).digest();
  let given: Buffer;
  try {
    given = Buffer.from(signature, "hex");
  } catch {
    return false;
  }
  return given.length === expected.length && timingSafeEqual(given, expected);
}

export interface PaystackTx {
  reference: string;
  status: string;
  amount: number; // kobo
  currency: string;
  paid_at?: string | null;
  metadata?: Record<string, unknown> | string | null;
  customer?: { customer_code?: string; email?: string } | null;
  plan?: { plan_code?: string } | null;
}

export function parseMetadata(m: PaystackTx["metadata"]): Record<string, unknown> {
  if (!m) return {};
  if (typeof m === "string") {
    try {
      const v = JSON.parse(m);
      return v && typeof v === "object" ? (v as Record<string, unknown>) : {};
    } catch {
      return {};
    }
  }
  return m;
}
