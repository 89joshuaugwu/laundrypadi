import { NextResponse } from "next/server";
import { demoOrder, demoOrderPhone } from "@/lib/demo";
import { getAdminDb } from "@/lib/firebase-admin";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import type { OrderStatus, TrackedOrder } from "@/lib/types";
import { cleanText, normalizePhone, normalizeRef } from "@/lib/validate";

export const runtime = "nodejs";

const NOT_FOUND = "No results found. Check the order reference and phone number, or contact the shop directly.";
const STATUSES: OrderStatus[] = ["received", "washing", "ready", "collected"];

function fail(message: string, status: number) {
  return NextResponse.json({ ok: false, error: message }, { status });
}

function str(v: unknown): string {
  return typeof v === "string" ? v : "";
}

export async function POST(req: Request) {
  if (!rateLimit(`track:${clientIp(req)}`, 10)) {
    return fail("Too many attempts. Please wait a minute and try again.", 429);
  }

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return fail("That request could not be read. Please try again.", 400);
  }

  if (typeof body.website === "string" && body.website.length > 0) return fail(NOT_FOUND, 404);

  const ref = normalizeRef(cleanText(body.ref, 20));
  const phone = normalizePhone(cleanText(body.phone, 20));
  if (!/^[A-Z]{2}-\d{2,8}$/.test(ref) || phone.length !== 11) {
    return fail("Enter your order reference (like LP-1042) and the phone number used for the booking.", 400);
  }

  const db = getAdminDb();
  if (!db) {
    if (ref === demoOrder.ref && phone === demoOrderPhone) return NextResponse.json({ ok: true, order: demoOrder });
    return fail(NOT_FOUND, 404);
  }

  // References can repeat across shops, so the phone number decides which order is returned.
  const snap = await db.collection("orders").where("ref", "==", ref).limit(10).get();
  const match = snap.docs.find((d) => d.data().phoneNormalized === phone);
  if (!match) return fail(NOT_FOUND, 404);

  const d = match.data();
  const status = STATUSES.includes(d.status) ? (d.status as OrderStatus) : "received";
  const timeline: TrackedOrder["timeline"] = {};
  for (const s of STATUSES) {
    const v = d.timeline?.[s];
    if (typeof v === "string") timeline[s] = v;
  }

  // Only what a customer needs. Phone numbers and internal notes never leave the server.
  const order: TrackedOrder = {
    ref,
    shopName: str(d.shopName),
    shopArea: str(d.shopArea),
    shopWhatsapp: str(d.shopWhatsapp),
    itemsLabel: str(d.itemsLabel),
    status,
    timeline,
    collectionDate: str(d.collectionDate),
    total: Number(d.total) || 0,
    paid: Number(d.paid) || 0,
  };
  return NextResponse.json({ ok: true, order });
}
