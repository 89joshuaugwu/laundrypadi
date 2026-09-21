import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { getCaller, jsonError } from "@/lib/server";
import { cleanText, normalizePhone, normalizeRef } from "@/lib/validate";

export const runtime = "nodejs";

/** Links an order to the signed-in customer. Needs the same proof as guest tracking: reference + phone number. */
export async function POST(req: Request) {
  const db = getAdminDb();
  if (!db) return jsonError("The server is not connected to Firebase yet.", 503);
  const caller = await getCaller(req);
  if (!caller) return jsonError("Please sign in again.", 401);
  if (!rateLimit(`claim:${caller.uid}:${clientIp(req)}`, 10)) return jsonError("Too many attempts. Please wait a minute.", 429);

  let b: Record<string, unknown>;
  try {
    b = (await req.json()) as Record<string, unknown>;
  } catch {
    return jsonError("That request could not be read.", 400);
  }
  const ref = normalizeRef(cleanText(b.ref, 20));
  const phone = normalizePhone(cleanText(b.phone, 20));
  const NOT_FOUND = "No results found. Check the order reference and the phone number the shop has for you.";
  if (!/^[A-Z]{2}-\d{2,8}$/.test(ref) || phone.length !== 11) return jsonError(NOT_FOUND, 400);

  const docRef = db.collection("orders").doc(ref);
  const snap = await docRef.get();
  const o = snap.data();
  if (!snap.exists || !o || o.phoneNormalized !== phone) return jsonError(NOT_FOUND, 404);
  if (o.customerUid && o.customerUid !== caller.uid) return jsonError("That order is already linked to another account.", 409);

  await docRef.update({ customerUid: caller.uid });
  return NextResponse.json({ ok: true, ref });
}
