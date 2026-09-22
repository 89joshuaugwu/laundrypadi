import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { applyTransaction } from "@/lib/billing";
import { getAdminDb } from "@/lib/firebase-admin";
import { ps, type PaystackTx } from "@/lib/paystack";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Confirming your payment", robots: { index: false, follow: false } };

/** Paystack sends people back here after checkout. We confirm the payment with Paystack, then go to Settings. */
export default async function BillingCallback({ searchParams }: { searchParams: { reference?: string; trxref?: string } }) {
  const reference = searchParams.reference || searchParams.trxref || "";
  let problem = "";

  if (!/^[A-Za-z0-9_-]{6,64}$/.test(reference)) {
    problem = "We could not find a payment to confirm.";
  } else {
    try {
      const db = getAdminDb();
      if (!db) throw new Error("db");
      const tx = await ps<PaystackTx>(`/transaction/verify/${encodeURIComponent(reference)}`);
      const result = await applyTransaction(db, tx);
      if (!result.ok) problem = result.error;
    } catch {
      problem = "We could not confirm your payment yet. If money left your account, it will show in Settings within a few minutes.";
    }
  }

  if (!problem) redirect("/owner/settings?tab=subscription&billing=success");

  return (
    <div className="container-page py-20 text-center">
      <h1 className="text-3xl font-extrabold tracking-tight">Payment not confirmed</h1>
      <p className="mx-auto mt-3 max-w-md text-lg text-ink-soft">{problem}</p>
      <Link href="/owner/settings?tab=subscription" className="btn btn-primary mt-8">Back to Settings</Link>
    </div>
  );
}
