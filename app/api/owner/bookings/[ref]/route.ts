import { NextResponse } from "next/server";
import type { OrderDoc, OrderItem } from "@/lib/models";
import { authOwner, itemsLabelOf, jsonError, nextOrderRef, upsertCustomer } from "@/lib/server";
import { todayLagos } from "@/lib/site";
import { cleanText, isIsoDate, toInt } from "@/lib/validate";

export const runtime = "nodejs";

type Result = { error: string; status: number } | { ok: true; orderRef?: string };

/** Accept (turns the request into an order) or decline a customer's booking request. */
export async function POST(req: Request, { params }: { params: { ref: string } }) {
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
  if (b.action !== "accept" && b.action !== "decline") return jsonError("Unknown action.", 400);

  const bookingRef = db.collection("bookings").doc(params.ref.toUpperCase());
  const pre = await bookingRef.get();
  const bk = pre.data();
  if (!pre.exists || !bk || bk.ownerId !== uid) return jsonError("Request not found.", 404);
  if (bk.status !== "pending") return jsonError("That request was already answered.", 409);

  if (b.action === "decline") {
    await bookingRef.update({ status: "declined", respondedAt: new Date().toISOString() });
    return NextResponse.json({ ok: true });
  }

  // Accept: the owner may confirm a final price and due date.
  const items: OrderItem[] = ((bk.items as OrderItem[]) ?? []).map((i) => ({ serviceId: i.serviceId, name: i.name, qty: i.qty, unitPrice: i.unitPrice }));
  const estimate = items.reduce((sum, i) => sum + i.qty * i.unitPrice, 0);
  const confirmed = b.price === undefined || b.price === "" ? estimate : toInt(b.price, 0, 100_000_000);
  if (confirmed === null) return jsonError("Enter a valid price.", 400);
  if (confirmed !== estimate) items.push({ serviceId: "adjustment", name: "Price adjustment", qty: 1, unitPrice: confirmed - estimate });

  const dueRaw = cleanText(b.dueDate, 10) || String(bk.preferredDate ?? "");
  if (!isIsoDate(dueRaw)) return jsonError("Choose a valid due date.", 400);

  const customer = await upsertCustomer(db, { ownerId: uid, shopId, name: String(bk.customerName), phone: String(bk.phone) });
  const orderRef = await nextOrderRef(db);
  const now = new Date().toISOString();

  const result: Result = await db.runTransaction(async (tx): Promise<Result> => {
    const fresh = await tx.get(bookingRef);
    if (fresh.data()?.status !== "pending") return { error: "That request was already answered.", status: 409 };
    const order: OrderDoc = {
      ref: orderRef,
      ownerId: uid,
      shopId,
      shopSlug: String(shop.slug),
      shopName: String(shop.name),
      shopArea: String(shop.area ?? ""),
      shopWhatsapp: String(shop.whatsapp ?? ""),
      customerId: customer.id,
      customerName: customer.name,
      customerUid: typeof bk.customerUid === "string" ? bk.customerUid : null,
      phone: customer.phone,
      phoneNormalized: customer.phoneNormalized,
      items,
      itemsLabel: itemsLabelOf(items),
      total: confirmed,
      paid: 0,
      payments: [],
      status: "received",
      timeline: { received: todayLagos() },
      collectionDate: dueRaw,
      notes: String(bk.notes ?? ""),
      activity: [{ at: now, text: `Created from booking request ${params.ref.toUpperCase()}` }],
      source: "booking",
      bookingRef: params.ref.toUpperCase(),
      createdAt: now,
      updatedAt: now,
    };
    tx.create(db.collection("orders").doc(orderRef), order as unknown as Record<string, unknown>);
    tx.update(bookingRef, { status: "accepted", orderRef, respondedAt: now });
    return { ok: true, orderRef };
  });

  if ("error" in result) return jsonError(result.error, result.status);
  return NextResponse.json({ ok: true, ref: orderRef });
}
