import { NextResponse } from "next/server";
import type { OrderDoc, PaymentMethod } from "@/lib/models";
import { METHOD_LABEL } from "@/lib/models";
import { authOwner, itemsLabelOf, jsonError, newId, nextOrderRef, parseItems, upsertCustomer } from "@/lib/server";
import { formatNaira, todayLagos } from "@/lib/site";
import type { Service } from "@/lib/types";
import { cleanText, isIsoDate, isValidNgPhone, toInt } from "@/lib/validate";

export const runtime = "nodejs";

/** Create a walk-in order. The reference, totals and first payment are all decided here, never in the browser. */
export async function POST(req: Request) {
  const a = await authOwner(req);
  if ("res" in a) return a.res;
  const { db, uid, shopId, shop } = a.ctx;
  if (!shop) return jsonError("Set up your shop first.", 409);

  let b: Record<string, unknown>;
  try {
    b = (await req.json()) as Record<string, unknown>;
  } catch {
    return jsonError("That request could not be read.", 400);
  }

  // Customer: an existing one, or a new one from name + phone.
  let customer: { id: string; name: string; phone: string; phoneNormalized: string };
  if (typeof b.customerId === "string" && b.customerId) {
    const snap = await db.collection("customers").doc(b.customerId).get();
    if (!snap.exists || snap.data()?.ownerId !== uid) return jsonError("We could not find that customer.", 404);
    const d = snap.data()!;
    customer = { id: snap.id, name: String(d.name), phone: String(d.phone), phoneNormalized: String(d.phoneNormalized) };
  } else {
    const name = cleanText(b.name, 80);
    const phone = cleanText(b.phone, 20);
    if (name.length < 2) return jsonError("Enter the customer's name.", 400);
    if (!isValidNgPhone(phone)) return jsonError("Enter a valid Nigerian phone number for the customer.", 400);
    customer = await upsertCustomer(db, { ownerId: uid, shopId, name, phone });
  }

  const parsed = parseItems(b.items, (shop.services ?? []) as Service[]);
  if (!parsed.ok) return jsonError(parsed.error, 400);

  const date = cleanText(b.collectionDate, 10);
  if (!isIsoDate(date)) return jsonError("Choose a collection date.", 400);

  const paidAmount = b.paidAmount === undefined || b.paidAmount === "" ? 0 : toInt(b.paidAmount, 0, parsed.total);
  if (paidAmount === null) return jsonError("The amount paid cannot be more than the total.", 400);
  const method: PaymentMethod = b.method === "transfer" ? "transfer" : "cash";

  const now = new Date().toISOString();
  const today = todayLagos();
  const activity = [{ at: now, text: "Order created" }];
  const payments = [];
  if (paidAmount > 0) {
    payments.push({ id: newId(), amount: paidAmount, method, at: now });
    activity.push({ at: now, text: `Payment of ${formatNaira(paidAmount)} recorded (${METHOD_LABEL[method]})` });
  }

  const ref = await nextOrderRef(db);
  const order: OrderDoc = {
    ref,
    ownerId: uid,
    shopId,
    shopSlug: String(shop.slug),
    shopName: String(shop.name),
    shopArea: String(shop.area ?? ""),
    shopWhatsapp: String(shop.whatsapp ?? ""),
    customerId: customer.id,
    customerName: customer.name,
    customerUid: null,
    phone: customer.phone,
    phoneNormalized: customer.phoneNormalized,
    items: parsed.items,
    itemsLabel: itemsLabelOf(parsed.items),
    total: parsed.total,
    paid: paidAmount,
    payments,
    status: "received",
    timeline: { received: today },
    collectionDate: date,
    notes: cleanText(b.notes, 500, true),
    activity,
    source: "walk-in",
    bookingRef: "",
    createdAt: now,
    updatedAt: now,
  };
  await db.collection("orders").doc(ref).create(order as unknown as Record<string, unknown>);
  return NextResponse.json({ ok: true, ref });
}
