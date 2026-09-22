import { randomBytes } from "crypto";
import { NextResponse } from "next/server";
import { ensureCustomer, getPlanCode } from "@/lib/billing";
import { BillingError, ps } from "@/lib/paystack";
import { authOwner, jsonError } from "@/lib/server";
import { site } from "@/lib/site";

export const runtime = "nodejs";

/** Starts a Paystack checkout for the setup fee or the monthly plan. Amounts always come from the server. */
export async function POST(req: Request) {
  const a = await authOwner(req);
  if ("res" in a) return a.res;
  const { db, uid, email, shopId, shop } = a.ctx;
  if (!shop) return jsonError("Set up your shop first.", 409);
  if (!email) return jsonError("Your account needs an email address to pay.", 400);

  let body: Record<string, unknown> = {};
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    /* handled below */
  }
  const purpose = body.purpose === "setup" || body.purpose === "subscription" ? body.purpose : null;
  if (!purpose) return jsonError("Choose what you are paying for.", 400);

  const sub = (shop.subscription ?? {}) as { setupPaid?: boolean; status?: string };
  if (purpose === "setup" && sub.setupPaid) return jsonError("Your setup fee is already paid.", 409);
  if (purpose === "subscription" && sub.status === "active") return jsonError("Your monthly plan is already active.", 409);

  try {
    const customerCode = await ensureCustomer(email);
    await db.collection("billing").doc(shopId).set({ customerCode, ownerId: uid }, { merge: true });

    const init: Record<string, unknown> = {
      email,
      amount: (purpose === "setup" ? site.pricing.setup : site.pricing.monthly) * 100,
      currency: "NGN",
      reference: `LPB-${randomBytes(6).toString("hex").toUpperCase()}`,
      callback_url: `${site.url}/billing/callback`,
      metadata: { shopId, ownerId: uid, purpose },
    };
    if (purpose === "subscription") init.plan = await getPlanCode(db);

    const data = await ps<{ authorization_url: string }>("/transaction/initialize", { method: "POST", body: init });
    return NextResponse.json({ ok: true, url: data.authorization_url });
  } catch (e) {
    if (e instanceof BillingError) return jsonError(e.message, e.status);
    return jsonError("We could not start the payment. Please try again.", 500);
  }
}
