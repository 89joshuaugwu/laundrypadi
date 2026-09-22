import { NextResponse } from "next/server";
import { authAdmin, jsonError } from "@/lib/server";
import { cleanText } from "@/lib/validate";

export const runtime = "nodejs";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const a = await authAdmin(req);
  if ("res" in a) return a.res;
  const { db } = a.ctx;

  const shopSnap = await db.collection("shops").doc(params.id).get();
  if (!shopSnap.exists) return jsonError("Shop not found.", 404);
  const shop = shopSnap.data()!;

  const [ownerSnap, ordersCount, customersCount, ordersSnap, paymentsSnap] = await Promise.all([
    shop.ownerId ? db.collection("users").doc(shop.ownerId).get() : Promise.resolve(null),
    db.collection("orders").where("shopId", "==", params.id).count().get(),
    db.collection("customers").where("shopId", "==", params.id).count().get(),
    db.collection("orders").where("shopId", "==", params.id).orderBy("createdAt", "desc").limit(10).get(),
    db.collection("billingPayments").where("shopId", "==", params.id).orderBy("paidAt", "desc").limit(10).get(),
  ]);

  return NextResponse.json({
    ok: true,
    shop: {
      id: shopSnap.id, name: shop.name, slug: shop.slug, area: shop.area, landmark: shop.landmark ?? "",
      phone: shop.phone ?? "", accepting: shop.accepting !== false, suspended: shop.suspended === true,
      suspendedReason: shop.suspendedReason ?? "", suspendedAt: shop.suspendedAt ?? "",
      subscription: shop.subscription ?? {}, createdAt: shop.createdAt ?? "",
    },
    owner: ownerSnap?.exists ? { name: ownerSnap.data()?.name ?? "", email: ownerSnap.data()?.email ?? "" } : null,
    orderCount: ordersCount.data().count,
    customerCount: customersCount.data().count,
    recentOrders: ordersSnap.docs.map((d) => {
      const o = d.data();
      return { ref: o.ref, customerName: o.customerName, status: o.status, total: o.total, paid: o.paid, createdAt: o.createdAt };
    }),
    recentPayments: paymentsSnap.docs.map((d) => {
      const p = d.data();
      return { reference: p.reference, purpose: p.purpose, amount: p.amount, paidAt: p.paidAt };
    }),
  });
}

/** Suspend or reactivate a shop. Suspending blocks every owner write (see authOwner) and public booking. */
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const a = await authAdmin(req);
  if ("res" in a) return a.res;
  const { db } = a.ctx;

  let b: Record<string, unknown>;
  try {
    b = (await req.json()) as Record<string, unknown>;
  } catch {
    return jsonError("That request could not be read.", 400);
  }
  const shopRef = db.collection("shops").doc(params.id);
  const snap = await shopRef.get();
  if (!snap.exists) return jsonError("Shop not found.", 404);

  if (b.action === "suspend") {
    const reason = cleanText(b.reason, 300);
    if (!reason) return jsonError("Give a reason for the record.", 400);
    await shopRef.update({ suspended: true, suspendedReason: reason, suspendedAt: new Date().toISOString() });
    return NextResponse.json({ ok: true });
  }
  if (b.action === "reactivate") {
    await shopRef.update({ suspended: false, suspendedReason: "", suspendedAt: "" });
    return NextResponse.json({ ok: true });
  }
  return jsonError("Unknown action.", 400);
}
