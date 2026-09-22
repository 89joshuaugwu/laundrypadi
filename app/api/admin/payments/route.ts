import { NextResponse } from "next/server";
import { authAdmin, jsonError } from "@/lib/server";
import { isIsoDate } from "@/lib/validate";

export const runtime = "nodejs";

/** Platform revenue ledger (LaundryPadi's own setup + monthly income), not shop order payments. */
export async function GET(req: Request) {
  const a = await authAdmin(req);
  if ("res" in a) return a.res;
  const { db } = a.ctx;

  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from") ?? "";
  const to = searchParams.get("to") ?? "";
  if (!isIsoDate(from) || !isIsoDate(to)) return jsonError("Choose a valid date range.", 400);

  const snap = await db
    .collection("billingPayments")
    .where("paidAt", ">=", `${from}T00:00:00.000Z`)
    .where("paidAt", "<=", `${to}T23:59:59.999Z`)
    .orderBy("paidAt", "desc")
    .limit(2000)
    .get();

  const payments = snap.docs.map((d) => {
    const p = d.data();
    return { reference: p.reference, shopName: p.shopName ?? "", shopSlug: p.shopSlug ?? "", purpose: p.purpose, amount: p.amount, paidAt: p.paidAt };
  });
  return NextResponse.json({ ok: true, payments });
}
