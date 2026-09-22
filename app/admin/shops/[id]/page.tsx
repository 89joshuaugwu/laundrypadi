"use client";

import { AlertTriangle, ArrowLeft, Loader2, MapPin, Phone, ShieldCheck, ShieldOff, Store } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { StatusChip } from "@/components/StatusChip";
import { Alert, Modal, PageSkeleton } from "@/components/ui";
import { apiFetch } from "@/lib/api";
import { formatDate, formatNaira, prettyPhone } from "@/lib/site";
import type { OrderStatus } from "@/lib/types";

interface Detail {
  shop: {
    id: string; name: string; slug: string; area: string; landmark: string; phone: string;
    accepting: boolean; suspended: boolean; suspendedReason: string; suspendedAt: string;
    subscription: { status?: string; monthly?: number; setupFee?: number; setupPaid?: boolean; nextInvoice?: string };
    createdAt: string;
  };
  owner: { name: string; email: string } | null;
  orderCount: number;
  customerCount: number;
  recentOrders: { ref: string; customerName: string; status: OrderStatus; total: number; paid: number; createdAt: string }[];
  recentPayments: { reference: string; purpose: string; amount: number; paidAt: string }[];
}

export default function AdminShopDetail() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<Detail | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [suspendOpen, setSuspendOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [formError, setFormError] = useState("");

  function load() {
    apiFetch<Detail>(`/api/admin/shops/${id}`, { method: "GET" })
      .then(setData)
      .catch((e: Error) => setError(e.message));
  }
  useEffect(load, [id]);

  async function suspend() {
    if (reason.trim().length < 3) return setFormError("Give a short reason for the record.");
    setBusy(true);
    setFormError("");
    try {
      await apiFetch(`/api/admin/shops/${id}`, { method: "PATCH", body: { action: "suspend", reason: reason.trim() } });
      setSuspendOpen(false);
      setReason("");
      load();
    } catch (e) {
      setFormError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function reactivate() {
    setBusy(true);
    try {
      await apiFetch(`/api/admin/shops/${id}`, { method: "PATCH", body: { action: "reactivate" } });
      load();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  if (error) return <Alert>{error}</Alert>;
  if (!data) return <PageSkeleton />;
  const { shop, owner } = data;
  const sub = shop.subscription;

  return (
    <div className="space-y-6">
      <Link href="/admin/shops" className="group inline-flex items-center gap-2 text-sm font-semibold text-ink-soft hover:text-primary">
        <ArrowLeft aria-hidden="true" className="h-4 w-4 transition-transform group-hover:-translate-x-1" />Back to shops
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">{shop.name}</h1>
          <p className="mt-1 flex items-center gap-1.5 text-ink-soft"><MapPin aria-hidden="true" className="h-4 w-4" />{shop.area}{shop.landmark ? ` \u2013 ${shop.landmark}` : ""}</p>
        </div>
        {shop.suspended ? (
          <button type="button" className="btn btn-primary" aria-busy={busy} onClick={reactivate}>{busy ? <Loader2 aria-hidden="true" className="h-5 w-5 animate-spin" /> : <ShieldCheck aria-hidden="true" className="h-5 w-5" />}Reactivate shop</button>
        ) : (
          <button type="button" className="btn btn-outline border-danger text-danger hover:bg-[#FDF0EE]" onClick={() => { setFormError(""); setSuspendOpen(true); }}><ShieldOff aria-hidden="true" className="h-5 w-5" />Suspend shop</button>
        )}
      </div>

      {shop.suspended && (
        <div className="flex items-start gap-3 rounded-lg border border-danger/30 bg-[#FDF0EE] p-4">
          <AlertTriangle aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-danger" />
          <div>
            <p className="font-semibold text-danger">Suspended {shop.suspendedAt ? formatDate(shop.suspendedAt.slice(0, 10), true) : ""}</p>
            <p className="text-sm text-ink">{shop.suspendedReason}</p>
            <p className="mt-1 text-sm text-ink-soft">The owner cannot make changes and the public page is not taking booking requests.</p>
          </div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="card space-y-4 p-5 sm:p-6">
          <h2 className="text-lg font-bold">Shop</h2>
          <dl className="space-y-2.5 text-sm">
            <div className="flex justify-between gap-4"><dt className="text-ink-soft">Public link</dt><dd className="text-right font-semibold">/s/{shop.slug}</dd></div>
            <div className="flex justify-between gap-4"><dt className="text-ink-soft">Phone</dt><dd className="flex items-center gap-1.5 font-semibold"><Phone aria-hidden="true" className="h-3.5 w-3.5" />{prettyPhone(shop.phone)}</dd></div>
            <div className="flex justify-between gap-4"><dt className="text-ink-soft">Owner</dt><dd className="text-right font-semibold">{owner?.name || "\u2014"}{owner?.email ? <span className="block font-normal text-ink-soft">{owner.email}</span> : null}</dd></div>
            <div className="flex justify-between gap-4"><dt className="text-ink-soft">Joined</dt><dd className="font-semibold">{shop.createdAt ? formatDate(shop.createdAt.slice(0, 10), true) : "\u2014"}</dd></div>
            <div className="flex justify-between gap-4"><dt className="text-ink-soft">Total orders</dt><dd className="font-semibold tabular-nums">{data.orderCount}</dd></div>
            <div className="flex justify-between gap-4"><dt className="text-ink-soft">Customer records</dt><dd className="font-semibold tabular-nums">{data.customerCount}</dd></div>
          </dl>
          <a href={`/s/${shop.slug}`} target="_blank" rel="noopener noreferrer" className="btn btn-outline btn-sm"><Store aria-hidden="true" className="h-4 w-4" />View public page</a>
        </section>

        <section className="card space-y-4 p-5 sm:p-6">
          <h2 className="text-lg font-bold">Subscription</h2>
          <dl className="space-y-2.5 text-sm">
            <div className="flex justify-between gap-4"><dt className="text-ink-soft">Status</dt><dd className="font-semibold capitalize">{sub.status ?? "pending"}</dd></div>
            <div className="flex justify-between gap-4"><dt className="text-ink-soft">Setup fee</dt><dd className="font-semibold">{sub.setupPaid ? "Paid" : "Not paid"}</dd></div>
            <div className="flex justify-between gap-4"><dt className="text-ink-soft">Monthly plan</dt><dd className="font-semibold tabular-nums">{formatNaira(sub.monthly ?? 5000)} / month</dd></div>
            {sub.nextInvoice && <div className="flex justify-between gap-4"><dt className="text-ink-soft">Next invoice</dt><dd className="font-semibold">{formatDate(sub.nextInvoice, true)}</dd></div>}
          </dl>
          {data.recentPayments.length > 0 && (
            <div>
              <h3 className="font-display font-bold">Recent payments</h3>
              <ul className="mt-2 divide-y divide-line text-sm">
                {data.recentPayments.map((p) => <li key={p.reference} className="flex justify-between py-2"><span className="text-ink-soft">{formatDate(p.paidAt.slice(0, 10))} &middot; {p.purpose === "setup" ? "Setup" : "Monthly"}</span><span className="font-semibold tabular-nums">{formatNaira(p.amount)}</span></li>)}
              </ul>
            </div>
          )}
        </section>
      </div>

      <section className="card overflow-hidden">
        <h2 className="p-5 pb-3 text-lg font-bold">Recent orders</h2>
        {data.recentOrders.length === 0 ? <p className="px-5 pb-5 text-ink-soft">No orders yet.</p> : (
          <ul className="divide-y divide-line">
            {data.recentOrders.map((o) => (
              <li key={o.ref} className="flex items-center justify-between gap-3 px-5 py-3 text-sm">
                <span><span className="font-semibold">{o.ref}</span><span className="ml-2 text-ink-soft">{o.customerName}</span></span>
                <span className="flex items-center gap-3"><StatusChip status={o.status} /><span className="font-semibold tabular-nums">{formatNaira(o.total)}</span></span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <Modal open={suspendOpen} onClose={() => setSuspendOpen(false)} title="Suspend this shop">
        <p className="text-ink-soft">The owner will not be able to manage orders, and the public page will stop taking booking requests. This does not lock the owner&rsquo;s sign-in.</p>
        <div className="mt-4">
          <label htmlFor="susp-reason" className="label">Reason (kept for your records, not shown publicly)</label>
          <textarea id="susp-reason" className="input" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Repeated customer complaints about unpaid balances" />
        </div>
        {formError && <div className="mt-3"><Alert>{formError}</Alert></div>}
        <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button type="button" className="btn btn-outline" onClick={() => setSuspendOpen(false)}>Cancel</button>
          <button type="button" className="btn btn-primary" aria-busy={busy} onClick={suspend}>{busy ? <Loader2 aria-hidden="true" className="h-5 w-5 animate-spin" /> : null}Suspend shop</button>
        </div>
      </Modal>
    </div>
  );
}
