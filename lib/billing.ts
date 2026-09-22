import type { Firestore } from "firebase-admin/firestore";
import { parseMetadata, ps, isLiveKey, type PaystackTx } from "./paystack";
import { site } from "./site";

export { BILLING_ENFORCED, billingOk } from "./billing-shared";

type Result = { ok: true; purpose: "setup" | "subscription"; duplicate?: boolean } | { ok: false; error: string };

async function shopIdByCustomer(db: Firestore, customerCode: string): Promise<string | null> {
  if (!customerCode) return null;
  const snap = await db.collection("billing").where("customerCode", "==", customerCode).limit(1).get();
  return snap.empty ? null : snap.docs[0].id;
}

/**
 * Applies a successful Paystack payment to the shop. Safe to call any number of times for the same
 * payment (webhook retries, the callback page, both): the payment reference is recorded exactly once.
 */
export async function applyTransaction(db: Firestore, tx: PaystackTx): Promise<Result> {
  if (tx.status !== "success") return { ok: false, error: "That payment was not successful." };
  if (tx.currency !== "NGN") return { ok: false, error: "Unexpected currency." };

  const meta = parseMetadata(tx.metadata);
  const customerCode = tx.customer?.customer_code ?? "";
  let shopId = typeof meta.shopId === "string" ? meta.shopId : "";
  let purpose = typeof meta.purpose === "string" ? meta.purpose : "";

  // Automatic monthly renewals come from Paystack without our metadata: find the shop by customer.
  if (!shopId && tx.plan?.plan_code) {
    shopId = (await shopIdByCustomer(db, customerCode)) ?? "";
    purpose = "subscription";
  }
  if (!shopId || (purpose !== "setup" && purpose !== "subscription")) return { ok: false, error: "This payment is not linked to a shop." };

  const expected = (purpose === "setup" ? site.pricing.setup : site.pricing.monthly) * 100;
  if (tx.amount < expected) return { ok: false, error: "The amount paid is less than the plan price." };

  const shopRef = db.collection("shops").doc(shopId);
  const payRef = db.collection("billingPayments").doc(tx.reference);
  const paidAt = tx.paid_at ?? new Date().toISOString();

  return db.runTransaction(async (t): Promise<Result> => {
    const [shopSnap, paySnap] = await Promise.all([t.get(shopRef), t.get(payRef)]);
    if (!shopSnap.exists) return { ok: false, error: "That shop no longer exists." };
    if (paySnap.exists) return { ok: true, purpose: purpose as "setup" | "subscription", duplicate: true };

    t.create(payRef, {
      reference: tx.reference,
      shopId,
      shopName: shopSnap.data()!.name ?? "",
      shopSlug: shopSnap.data()!.slug ?? "",
      ownerId: shopSnap.data()!.ownerId,
      purpose,
      amount: Math.round(tx.amount / 100),
      paidAt,
      createdAt: new Date().toISOString(),
    });
    const patch: Record<string, unknown> = { "subscription.lastPaymentAt": paidAt };
    if (purpose === "setup") {
      patch["subscription.setupPaid"] = true;
      patch["subscription.setupPaidAt"] = paidAt;
    } else {
      patch["subscription.status"] = "active";
    }
    t.update(shopRef, patch);
    if (customerCode) t.set(db.collection("billing").doc(shopId), { customerCode }, { merge: true });
    return { ok: true, purpose: purpose as "setup" | "subscription" };
  });
}

/** `subscription.create`: remember the codes needed to cancel or update the card, and the next charge date. */
export async function applySubscriptionCreated(
  db: Firestore,
  d: { subscription_code?: string; email_token?: string; next_payment_date?: string | null; customer?: { customer_code?: string } | null },
): Promise<boolean> {
  const shopId = await shopIdByCustomer(db, d.customer?.customer_code ?? "");
  if (!shopId) return false;
  await db.collection("billing").doc(shopId).set({ subscriptionCode: d.subscription_code ?? "", emailToken: d.email_token ?? "" }, { merge: true });
  await db.collection("shops").doc(shopId).update({
    "subscription.status": "active",
    "subscription.nextInvoice": (d.next_payment_date ?? "").slice(0, 10),
  });
  return true;
}

/** `invoice.payment_failed`, `subscription.disable`, `subscription.not_renew`. */
export async function setStatusByCustomer(db: Firestore, customerCode: string, status: "attention" | "cancelled"): Promise<boolean> {
  const shopId = await shopIdByCustomer(db, customerCode);
  if (!shopId) return false;
  await db.collection("shops").doc(shopId).update({
    "subscription.status": status,
    ...(status === "cancelled" ? { "subscription.nextInvoice": "" } : {}),
  });
  return true;
}

/** The customer code Paystack uses for this email, created on first use. */
export async function ensureCustomer(email: string): Promise<string> {
  try {
    return (await ps<{ customer_code: string }>(`/customer/${encodeURIComponent(email)}`)).customer_code;
  } catch {
    return (await ps<{ customer_code: string }>("/customer", { method: "POST", body: { email } })).customer_code;
  }
}

/** The monthly plan's code: from PAYSTACK_PLAN_CODE, or created once and remembered (per test/live mode). */
export async function getPlanCode(db: Firestore): Promise<string> {
  if (process.env.PAYSTACK_PLAN_CODE) return process.env.PAYSTACK_PLAN_CODE;
  const mode = isLiveKey() ? "live" : "test";
  const ref = db.collection("config").doc("billing");
  const snap = await ref.get();
  const saved = snap.data();
  if (saved?.planCode && saved.mode === mode && saved.amount === site.pricing.monthly) return String(saved.planCode);

  const plan = await ps<{ plan_code: string }>("/plan", {
    method: "POST",
    body: { name: "LaundryPadi Launch plan", interval: "monthly", amount: site.pricing.monthly * 100, currency: "NGN" },
  });
  await ref.set({ planCode: plan.plan_code, mode, amount: site.pricing.monthly }, { merge: true });
  return plan.plan_code;
}

/** Codes needed to manage or cancel the plan. Falls back to asking Paystack if the webhook has not saved them yet. */
export async function resolveSubscription(db: Firestore, shopId: string): Promise<{ code: string; token: string } | null> {
  const snap = await db.collection("billing").doc(shopId).get();
  const b = snap.data();
  if (b?.subscriptionCode && b?.emailToken) return { code: String(b.subscriptionCode), token: String(b.emailToken) };
  if (!b?.customerCode) return null;
  const customer = await ps<{ subscriptions?: { subscription_code: string; email_token: string; status: string }[] }>(`/customer/${encodeURIComponent(String(b.customerCode))}`);
  const live = customer.subscriptions?.find((s) => s.status === "active" || s.status === "non-renewing");
  if (!live) return null;
  await db.collection("billing").doc(shopId).set({ subscriptionCode: live.subscription_code, emailToken: live.email_token }, { merge: true });
  return { code: live.subscription_code, token: live.email_token };
}
