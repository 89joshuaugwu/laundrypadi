"use client";

import { AlertTriangle, Search, Store } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { EmptyState, PageSkeleton } from "@/components/ui";
import { apiFetch } from "@/lib/api";
import { formatDate } from "@/lib/site";

interface AdminShop {
  id: string; name: string; slug: string; area: string; phone: string; ownerId: string;
  accepting: boolean; suspended: boolean; subscription: { status?: string; monthly?: number; setupPaid?: boolean };
  services: number; createdAt: string;
}

const subStatus: Record<string, { label: string; cls: string }> = {
  pending: { label: "Pending", cls: "bg-citrus/50 text-ink" },
  active: { label: "Active", cls: "bg-[#D6F0DE] text-[#0A5F34]" },
  attention: { label: "Payment failed", cls: "bg-[#FBE5E1] text-[#8F2417]" },
  cancelled: { label: "Cancelled", cls: "bg-[#ECF0ED] text-[#42544F]" },
};

export default function AdminShopsPage() {
  const [shops, setShops] = useState<AdminShop[] | null>(null);
  const [error, setError] = useState("");
  const [q, setQ] = useState("");

  useEffect(() => {
    apiFetch<{ shops: AdminShop[] }>("/api/admin/shops", { method: "GET" })
      .then((res) => setShops(res.shops))
      .catch((e: Error) => setError(e.message));
  }, []);

  const term = q.trim().toLowerCase();
  const list = useMemo(
    () => (shops ?? []).filter((s) => !term || s.name.toLowerCase().includes(term) || s.slug.includes(term) || s.area.toLowerCase().includes(term)),
    [shops, term],
  );

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Shops</h1>

      {error ? (
        <p className="text-danger">{error}</p>
      ) : !shops ? (
        <PageSkeleton />
      ) : shops.length === 0 ? (
        <EmptyState icon={<Store aria-hidden="true" className="h-7 w-7" />} title="No shops yet" />
      ) : (
        <section className="card overflow-hidden">
          <div className="relative border-b border-line p-4">
            <Search aria-hidden="true" className="pointer-events-none absolute left-7 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft" />
            <label htmlFor="shop-search" className="sr-only">Search shops</label>
            <input id="shop-search" className="input pl-10" placeholder="Search by name, link or address" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          {list.length === 0 ? (
            <p className="p-6 text-center text-ink-soft">No shops match your search.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-sm">
                <caption className="sr-only">All shops on LaundryPadi</caption>
                <thead>
                  <tr className="border-b border-line text-left text-ink-soft">
                    <th className="px-5 py-2.5 font-medium">Shop</th>
                    <th className="py-2.5 font-medium">Billing</th>
                    <th className="py-2.5 font-medium">Status</th>
                    <th className="py-2.5 font-medium">Services</th>
                    <th className="px-5 py-2.5 font-medium">Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {list.map((s) => {
                    const st = subStatus[s.subscription.status ?? "pending"] ?? subStatus.pending;
                    return (
                      <tr key={s.id} className="border-b border-line/60">
                        <td className="px-5 py-3">
                          <Link href={`/admin/shops/${s.id}`} className="font-semibold text-ink hover:text-primary">{s.name}</Link>
                          <span className="block text-xs text-ink-soft">/s/{s.slug} &middot; {s.area}</span>
                        </td>
                        <td className="py-3"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${st.cls}`}>{st.label}</span></td>
                        <td className="py-3">
                          {s.suspended ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-[#FBE5E1] px-2.5 py-1 text-xs font-semibold text-[#8F2417]"><AlertTriangle aria-hidden="true" className="h-3 w-3" />Suspended</span>
                          ) : s.accepting ? (
                            <span className="rounded-full bg-[#D6F0DE] px-2.5 py-1 text-xs font-semibold text-[#0A5F34]">Live</span>
                          ) : (
                            <span className="rounded-full bg-[#ECF0ED] px-2.5 py-1 text-xs font-semibold text-[#42544F]">Paused</span>
                          )}
                        </td>
                        <td className="py-3 tabular-nums">{s.services}</td>
                        <td className="px-5 py-3 text-ink-soft">{s.createdAt ? formatDate(s.createdAt.slice(0, 10), true) : "\u2014"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
