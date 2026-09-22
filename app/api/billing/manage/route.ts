import { NextResponse } from "next/server";
import { resolveSubscription } from "@/lib/billing";
import { BillingError, ps } from "@/lib/paystack";
import { authOwner, jsonError } from "@/lib/server";

export const runtime = "nodejs";

/** A Paystack-hosted page where the owner can update the card used for the monthly plan. */
export async function POST(req: Request) {
  const a = await authOwner(req);
  if ("res" in a) return a.res;
  const { db, shopId } = a.ctx;
  try {
    const sub = await resolveSubscription(db, shopId);
    if (!sub) return jsonError("There is no monthly plan to manage yet.", 404);
    const data = await ps<{ link: string }>(`/subscription/${encodeURIComponent(sub.code)}/manage/link`);
    return NextResponse.json({ ok: true, url: data.link });
  } catch (e) {
    if (e instanceof BillingError) return jsonError(e.message, e.status);
    return jsonError("We could not open the card page. Please try again.", 500);
  }
}
