"use client";

import { collection, onSnapshot, query, where } from "firebase/firestore";
import { CheckCircle2, CreditCard, Loader2, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { getDb } from "@/lib/firebase";
import { apiFetch } from "@/lib/api";
import { BILLING_ENFORCED, billingOk } from "@/lib/billing-shared";
import type { OwnerShop } from "@/lib/models";
import { formatDate, formatNaira } from "@/lib/site";
import { Alert, Modal } from "../ui";
import { useAuth } from "../AuthProvider";

interface BillingPayment {
  reference: string;
  purpose: "setup" | "subscription";
  amount: number;
  paidAt: string;
}

const STATUS: Record<string, { label: string; cls: string }> = {
  pending: { label: "Not started", cls: "bg-citrus/50 text-ink" },
  active: { label: "Active", cls: "bg-[#D6F0DE] text-[#0A5F34]" },
  attention: { label: "Payment failed", cls: "bg-[#FBE5E1] text-[#8F2417]" },
  cancelled: { label: "Cancelled", cls: "bg-[#ECF0ED] text-[#42544F]" },
};

export function SubscriptionPanel({ shop, justPaid }: { shop: OwnerShop; justPaid: boolean }) {
  const { user } = useAuth();
  const sub = shop.subscription;
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [done, setDone] = useState("");
  const [payments, setPayments] = useState<BillingPayment[]>([]);

  useEffect(() => {
    const db = getDb();
    if (!db || !user) return;
    return onSnapshot(query(collection(db, "billingPayments"), where("ownerId", "==", user.uid)), (snap) => {
      setPayments(
        snap.docs
          .map((d) => d.data() as BillingPayment)
          .sort((a, b) => String(b.paidAt).localeCompare(String(a.paidAt))),
      );
    });
  }, [user]);

  /** Sends the owner to a Paystack-hosted page. Card details never touch LaundryPadi. */
  async function go(key: string, path: string, body?: unknown) {
    setBusy(key);
    setError("");
    try {
      const res = await apiFetch<{ url: string }>(path, { body });
      window.location.assign(res.url);
    } catch (e) {
      setError((e as Error).message);
      setBusy("");
    }
  }

  async function cancel() {
    setBusy("cancel");
    setError("");
    try {
      await apiFetch("/api/billing/cancel");
      setConfirmCancel(false);
      setDone("Your monthly plan is cancelled. You will not be charged again.");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy("");
    }
  }

  const st = STATUS[sub.status] ?? STATUS.pending;
  const ok = billingOk(sub);
  const btn = (key: string, label: string, onClick: () => void, variant = "btn-primary") => (
    <button type="button" className={`btn ${variant} btn-sm`} aria-busy={busy === key} disabled={!!busy && busy !== key} onClick={onClick}>
      {busy === key ? <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" /> : null}
      {label}
    </button>
  );

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[1.3fr_1fr]">
      <div className="space-y-6">
        {justPaid && <Alert tone="success">Payment received. Thank you! Your plan below is updated.</Alert>}
        {done && <Alert tone="success">{done}</Alert>}
        {error && <Alert>{error}</Alert>}
        {!ok && (
          <Alert tone="error">
            {BILLING_ENFORCED
              ? "Your public shop page is not taking online booking requests until your setup fee and monthly plan are active."
              : "Finish the two steps below to complete your subscription."}
          </Alert>
        )}

        <section className="card space-y-5 p-5 sm:p-7">
          <div className="rounded-lg bg-mint p-4">
            <p className="text-sm text-ink-soft">Launch plan</p>
            <p className="font-display text-3xl font-extrabold tabular-nums">{formatNaira(sub.monthly)} <span className="text-base font-bold">/ month</span></p>
            <p className="text-sm text-ink-soft">plus a one-time setup fee of {formatNaira(sub.setupFee)}. No hidden fees.</p>
          </div>

          <ol className="divide-y divide-line">
            <li className="flex flex-wrap items-center justify-between gap-3 py-4">
              <div>
                <p className="font-display font-bold">1. One-time setup</p>
                <p className="text-sm text-ink-soft">{formatNaira(sub.setupFee)} to get your shop online</p>
              </div>
              {sub.setupPaid ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#D6F0DE] px-3 py-1 text-sm font-semibold text-[#0A5F34]"><CheckCircle2 aria-hidden="true" className="h-4 w-4" />Paid</span>
              ) : (
                btn("setup", `Pay ${formatNaira(sub.setupFee)}`, () => go("setup", "/api/billing/checkout", { purpose: "setup" }))
              )}
            </li>
            <li className="flex flex-wrap items-center justify-between gap-3 py-4">
              <div>
                <p className="font-display font-bold">2. Monthly plan</p>
                <p className="text-sm text-ink-soft">
                  {formatNaira(sub.monthly)} a month, charged automatically
                  {sub.status === "active" && sub.nextInvoice ? `. Next charge ${formatDate(sub.nextInvoice, true)}` : ""}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className={`rounded-full px-3 py-1 text-sm font-semibold ${st.cls}`}>{st.label}</span>
                {(sub.status === "pending" || sub.status === "cancelled") && btn("plan", sub.status === "cancelled" ? "Restart plan" : "Start plan", () => go("plan", "/api/billing/checkout", { purpose: "subscription" }))}
                {(sub.status === "active" || sub.status === "attention") && btn("card", "Update card", () => go("card", "/api/billing/manage"), "btn-outline")}
              </div>
            </li>
          </ol>

          {sub.status === "attention" && <Alert>Your last monthly payment did not go through. Update your card to keep your plan active.</Alert>}

          <p className="flex items-start gap-2 text-sm text-ink-soft">
            <ShieldCheck aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            Payments are handled by Paystack. LaundryPadi never sees or stores your card details.
          </p>
          {sub.status === "active" && (
            <button type="button" className="text-sm font-semibold text-danger underline underline-offset-4" onClick={() => { setError(""); setConfirmCancel(true); }}>Cancel monthly plan</button>
          )}
        </section>
      </div>

      <section className="card overflow-hidden">
        <h2 className="flex items-center gap-2 p-5 pb-3 text-lg font-bold"><CreditCard aria-hidden="true" className="h-5 w-5 text-primary" />Billing history</h2>
        {payments.length === 0 ? (
          <p className="px-5 pb-6 text-ink-soft">Your payments will be listed here.</p>
        ) : (
          <ul className="divide-y divide-line border-t border-line text-sm">
            {payments.map((p) => (
              <li key={p.reference} className="flex items-center justify-between gap-3 px-5 py-3">
                <span><span className="block font-semibold">{p.purpose === "setup" ? "Setup fee" : "Monthly plan"}</span><span className="text-ink-soft">{p.paidAt ? formatDate(p.paidAt.slice(0, 10), true) : ""}</span></span>
                <span className="font-semibold tabular-nums">{formatNaira(p.amount)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <Modal open={confirmCancel} onClose={() => setConfirmCancel(false)} title="Cancel your monthly plan?">
        <p className="text-ink-soft">You will not be charged again. {BILLING_ENFORCED ? "Your public page will stop taking online booking requests. " : ""}You can restart the plan any time. Your setup fee is not affected.</p>
        {error && <div className="mt-3"><Alert>{error}</Alert></div>}
        <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button type="button" className="btn btn-outline" onClick={() => setConfirmCancel(false)}>Keep my plan</button>
          <button type="button" className="btn btn-primary" aria-busy={busy === "cancel"} onClick={cancel}>{busy === "cancel" ? <Loader2 aria-hidden="true" className="h-5 w-5 animate-spin" /> : null}Cancel plan</button>
        </div>
      </Modal>
    </div>
  );
}
