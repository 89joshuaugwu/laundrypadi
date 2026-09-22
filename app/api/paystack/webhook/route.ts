import { NextResponse } from "next/server";
import { applySubscriptionCreated, applyTransaction, setStatusByCustomer } from "@/lib/billing";
import { getAdminDb } from "@/lib/firebase-admin";
import { verifySignature, type PaystackTx } from "@/lib/paystack";

export const runtime = "nodejs";

/**
 * Paystack calls this for every payment event. It is the source of truth: the signature proves the
 * call is from Paystack, and every handler is safe to run twice. Set this URL in the Paystack
 * dashboard (Settings > API Keys & Webhooks) for both test and live mode.
 */
export async function POST(req: Request) {
  const raw = await req.text(); // the signature covers the exact raw body
  if (!verifySignature(raw, req.headers.get("x-paystack-signature"))) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  const db = getAdminDb();
  if (!db) return NextResponse.json({ ok: false }, { status: 503 });

  let event: { event?: string; data?: Record<string, unknown> };
  try {
    event = JSON.parse(raw);
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  const data = (event.data ?? {}) as Record<string, unknown> & { customer?: { customer_code?: string } | null };

  try {
    switch (event.event) {
      case "charge.success":
        await applyTransaction(db, data as unknown as PaystackTx);
        break;
      case "subscription.create":
        await applySubscriptionCreated(db, data as Parameters<typeof applySubscriptionCreated>[1]);
        break;
      case "invoice.payment_failed":
        await setStatusByCustomer(db, data.customer?.customer_code ?? "", "attention");
        break;
      case "subscription.disable":
      case "subscription.not_renew":
        await setStatusByCustomer(db, data.customer?.customer_code ?? "", "cancelled");
        break;
      default:
        break; // events we do not act on are still acknowledged
    }
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 }); // Paystack will retry
  }
  return NextResponse.json({ ok: true });
}
