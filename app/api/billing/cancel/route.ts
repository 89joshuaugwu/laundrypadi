import { NextResponse } from "next/server";
import { resolveSubscription } from "@/lib/billing";
import { BillingError, ps } from "@/lib/paystack";
import { authOwner, jsonError } from "@/lib/server";

export const runtime = "nodejs";

/** Stops the monthly plan. The setup fee is one-time and is not affected. */
export async function POST(req: Request) {
  const a = await authOwner(req);
  if ("res" in a) return a.res;
  const { db, shopId } = a.ctx;
  try {
    const sub = await resolveSubscription(db, shopId);
    if (!sub) return jsonError("There is no active monthly plan to cancel.", 404);
    await ps("/subscription/disable", { method: "POST", body: { code: sub.code, token: sub.token } });
    await db.collection("shops").doc(shopId).update({ "subscription.status": "cancelled", "subscription.nextInvoice": "" });
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof BillingError) return jsonError(e.message, e.status);
    return jsonError("We could not cancel the plan. Please try again.", 500);
  }
}
