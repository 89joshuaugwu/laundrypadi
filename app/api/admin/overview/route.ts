import { NextResponse } from "next/server";
import { billingOk } from "@/lib/billing-shared";
import { authAdmin } from "@/lib/server";
import { site } from "@/lib/site";

export const runtime = "nodejs";

interface Row {
  paidAt?: unknown;
  purpose?: unknown;
  amount?: unknown;
}

export async function GET(req: Request) {
  const a = await authAdmin(req);
  if ("res" in a) return a.res;
  const { db } = a.ctx;

  const [shopsSnap, ordersCount, customersCount, custUsersCount, ownerUsersCount, paymentsSnap] = await Promise.all([
    db.collection("shops").orderBy("createdAt", "desc").get(),
    db.collection("orders").count().get(),
    db.collection("customers").count().get(),
    db.collection("users").where("role", "==", "customer").count().get(),
    db.collection("users").where("role", "==", "owner").count().get(),
    // Reading the full ledger is fine at today's volume; move to a running counter if this grows large.
    db.collection("billingPayments").orderBy("paidAt", "desc").limit(2000).get(),
  ]);

  const shops = shopsSnap.docs.map((d) => d.data());
  const suspended = shops.filter((s) => s.suspended === true).length;
  const paid = shops.filter((s) => billingOk(s.subscription)).length;

  const payments = paymentsSnap.docs.map((d) => d.data() as Row);
  const revenue = payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  const setupRevenue = payments.filter((p) => p.purpose === "setup").reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  const monthlyRevenue = revenue - setupRevenue;

  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString();
  const recentShops = shops.slice(0, 8).map((s) => ({
    name: s.name, slug: s.slug, area: s.area, accepting: s.accepting !== false, suspended: s.suspended === true,
    status: s.subscription?.status ?? "pending", createdAt: s.createdAt,
  }));
  const recentPayments = paymentsSnap.docs.slice(0, 8).map((d) => {
    const p = d.data();
    return { reference: p.reference, shopName: p.shopName ?? "", purpose: p.purpose, amount: p.amount, paidAt: p.paidAt };
  });

  return NextResponse.json({
    ok: true,
    totals: {
      shops: shops.length,
      paidShops: paid,
      suspendedShops: suspended,
      customers: custUsersCount.data().count,
      owners: ownerUsersCount.data().count,
      shopCustomerRecords: customersCount.data().count,
      orders: ordersCount.data().count,
      revenue,
      setupRevenue,
      monthlyRevenue,
      signupsLast30d: shops.filter((s) => typeof s.createdAt === "string" && s.createdAt >= thirtyDaysAgo).length,
    },
    pricing: site.pricing,
    recentShops,
    recentPayments,
  });
}
