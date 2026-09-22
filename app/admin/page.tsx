"use client";

import { AlertTriangle, ArrowRight, ClipboardList, CreditCard, ShieldCheck, ShieldOff, Store, UserCheck, Users } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Alert, PageSkeleton, StatCard } from "@/components/ui";
import { apiFetch } from "@/lib/api";
import { formatDate, formatNaira } from "@/lib/site";

interface Overview {
  totals: {
    shops: number; paidShops: number; suspendedShops: number; customers: number; owners: number;
    shopCustomerRecords: number; orders: number; revenue: number; setupRevenue: number; monthlyRevenue: number; signupsLast30d: number;
  };
  recentShops: { name: string; slug: string; area: string; accepting: boolean; suspended: boolean; status: string; createdAt: string }[];
  recentPayments: { reference: string; shopName: string; purpose: string; amount: number; paidAt: string }[];
}

const subStatus: Record<string, { label: string; cls: string }> = {
  pending: { label: "Pending", cls: "bg-citrus/50 text-ink" },
  active: { label: "Active", cls: "bg-[#D6F0DE] text-[#0A5F34]" },
  attention: { label: "Payment failed", cls: "bg-[#FBE5E1] text-[#8F2417]" },
  cancelled: { label: "Cancelled", cls: "bg-[#ECF0ED] text-[#42544F]" },
};

export default function AdminOverview() {
  const [data, setData] = useState<Overview | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    apiFetch<Overview>("/api/admin/overview", { method: "GET" })
      .then((res) => !cancelled && setData(res))
      .catch((e: Error) => !cancelled && setError(e.message));
    return () => {
      cancelled = true;
    };
  }, []);

  if (error) return <Alert>{error}</Alert>;
  if (!data) return <PageSkeleton />;
  const t = data.totals;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Platform overview</h1>

      <div>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-ink-soft">LaundryPadi revenue</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard icon={<CreditCard aria-hidden="true" className="h-6 w-6" />} label="Total revenue" value={formatNaira(t.revenue)} />
          <StatCard icon={<ShieldCheck aria-hidden="true" className="h-6 w-6" />} label="Setup fees collected" value={formatNaira(t.setupRevenue)} tone="blue" />
          <StatCard icon={<CreditCard aria-hidden="true" className="h-6 w-6" />} label="Monthly plan revenue" value={formatNaira(t.monthlyRevenue)} tone="blue" />
        </div>
      </div>

      <div>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-ink-soft">Marketplace</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard icon={<Store aria-hidden="true" className="h-6 w-6" />} label="Shops" value={`${t.shops} (${t.paidShops} paid)`} />
          <StatCard icon={<ShieldOff aria-hidden="true" className="h-6 w-6" />} label="Suspended shops" value={t.suspendedShops} tone={t.suspendedShops > 0 ? "red" : "mint"} />
          <StatCard icon={<ClipboardList aria-hidden="true" className="h-6 w-6" />} label="Total orders" value={t.orders} tone="blue" />
          <StatCard icon={<UserCheck aria-hidden="true" className="h-6 w-6" />} label="Registered customers" value={t.customers} />
          <StatCard icon={<Users aria-hidden="true" className="h-6 w-6" />} label="Shop owners" value={t.owners} tone="blue" />
          <StatCard icon={<Store aria-hidden="true" className="h-6 w-6" />} label="New shops (30 days)" value={t.signupsLast30d} />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="card overflow-hidden">
          <div className="flex items-center justify-between gap-3 p-5 pb-3">
            <h2 className="text-lg font-bold">Recent shops</h2>
            <Link href="/admin/shops" className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary">View all <ArrowRight aria-hidden="true" className="h-4 w-4" /></Link>
          </div>
          {data.recentShops.length === 0 ? <p className="px-5 pb-5 text-ink-soft">No shops yet.</p> : (
            <ul className="divide-y divide-line">
              {data.recentShops.map((s) => {
                const st = subStatus[s.status] ?? subStatus.pending;
                return (
                  <li key={s.slug}>
                    <Link href="/admin/shops" className="flex items-center justify-between gap-3 px-5 py-3 text-sm hover:bg-canvas">
                      <span className="min-w-0"><span className="block truncate font-semibold">{s.name}</span><span className="block truncate text-ink-soft">{s.area}</span></span>
                      <span className="flex shrink-0 items-center gap-2">
                        {s.suspended && <span className="inline-flex items-center gap-1 rounded-full bg-[#FBE5E1] px-2.5 py-1 text-xs font-semibold text-[#8F2417]"><AlertTriangle aria-hidden="true" className="h-3 w-3" />Suspended</span>}
                        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${st.cls}`}>{st.label}</span>
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section className="card overflow-hidden">
          <div className="flex items-center justify-between gap-3 p-5 pb-3">
            <h2 className="text-lg font-bold">Recent payments</h2>
            <Link href="/admin/payments" className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary">View all <ArrowRight aria-hidden="true" className="h-4 w-4" /></Link>
          </div>
          {data.recentPayments.length === 0 ? <p className="px-5 pb-5 text-ink-soft">No payments yet.</p> : (
            <ul className="divide-y divide-line">
              {data.recentPayments.map((p) => (
                <li key={p.reference} className="flex items-center justify-between gap-3 px-5 py-3 text-sm">
                  <span><span className="block font-semibold">{p.shopName || "Unknown shop"}</span><span className="text-ink-soft">{p.purpose === "setup" ? "Setup fee" : "Monthly plan"} &middot; {p.paidAt ? formatDate(String(p.paidAt).slice(0, 10), true) : ""}</span></span>
                  <span className="font-semibold tabular-nums">{formatNaira(Number(p.amount) || 0)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
