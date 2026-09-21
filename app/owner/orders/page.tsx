"use client";

import { Check, ChevronLeft, ChevronRight, Inbox, Loader2, Plus, Search } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import { OrderTable } from "@/components/owner/OrderTable";
import { useOwner } from "@/components/owner/OwnerProvider";
import { Alert, EmptyState, Modal, PageSkeleton, PillTabs } from "@/components/ui";
import { apiFetch } from "@/lib/api";
import { isOverdue, type BookingDoc } from "@/lib/models";
import { formatDate, formatNaira, prettyPhone, todayLagos } from "@/lib/site";

type Tab = "all" | "requests" | "ready" | "collected";
const PAGE = 8;

function RequestPanel({ booking, onDone }: { booking: BookingDoc; onDone: (ref?: string) => void }) {
  const [price, setPrice] = useState(String(booking.estimatedTotal));
  const [due, setDue] = useState(booking.preferredDate);
  const [busy, setBusy] = useState<"accept" | "decline" | null>(null);
  const [error, setError] = useState("");
  const [confirmDecline, setConfirmDecline] = useState(false);

  useEffect(() => {
    setPrice(String(booking.estimatedTotal));
    setDue(booking.preferredDate);
    setError("");
  }, [booking]);

  async function act(action: "accept" | "decline") {
    setBusy(action);
    setError("");
    try {
      const res = await apiFetch<{ ref?: string }>(`/api/owner/bookings/${booking.ref}`, { body: { action, price, dueDate: due } });
      setConfirmDecline(false);
      onDone(res.ref);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="card space-y-4 p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm text-ink-soft">Booking request</p>
          <p className="font-display text-xl font-extrabold">{booking.ref}</p>
        </div>
        <span className="rounded-full bg-citrus/50 px-3 py-1 text-xs font-semibold">Pending</span>
      </div>
      <dl className="space-y-2 text-sm">
        <div className="flex justify-between gap-3"><dt className="text-ink-soft">From</dt><dd className="text-right font-semibold">{booking.customerName}<span className="block font-normal text-ink-soft">{prettyPhone(booking.phone)}</span></dd></div>
        <div className="flex justify-between gap-3"><dt className="text-ink-soft">Items</dt><dd className="text-right font-semibold">{booking.items.map((i) => `${i.qty} ${i.name.toLowerCase()}`).join(", ")}</dd></div>
        <div className="flex justify-between gap-3"><dt className="text-ink-soft">Estimated price</dt><dd className="font-semibold tabular-nums">{formatNaira(booking.estimatedTotal)}</dd></div>
        <div className="flex justify-between gap-3"><dt className="text-ink-soft">Preferred date</dt><dd className="font-semibold">{formatDate(booking.preferredDate, true)}</dd></div>
        {booking.notes && <div><dt className="text-ink-soft">Message</dt><dd className="mt-1 rounded bg-canvas p-3">&ldquo;{booking.notes}&rdquo;</dd></div>}
      </dl>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
        <div>
          <label htmlFor="rq-price" className="label">Confirm price (&#8358;)</label>
          <input id="rq-price" className="input" inputMode="numeric" value={price} onChange={(e) => setPrice(e.target.value.replace(/\D/g, ""))} />
        </div>
        <div>
          <label htmlFor="rq-due" className="label">Due date</label>
          <input id="rq-due" type="date" className="input" value={due} onChange={(e) => setDue(e.target.value)} />
        </div>
      </div>
      {error && <Alert>{error}</Alert>}
      <div className="flex flex-col gap-2 sm:flex-row lg:flex-col xl:flex-row">
        <button type="button" className="btn btn-primary flex-1" aria-busy={busy === "accept"} onClick={() => act("accept")}>
          {busy === "accept" ? <Loader2 aria-hidden="true" className="h-5 w-5 animate-spin" /> : <Check aria-hidden="true" className="h-5 w-5" />}Accept request
        </button>
        <button type="button" className="btn btn-outline flex-1" onClick={() => setConfirmDecline(true)}>Decline</button>
      </div>
      <p className="text-xs text-ink-soft">Accepting adds this as a new order and the customer can track it.</p>

      <Modal open={confirmDecline} onClose={() => setConfirmDecline(false)} title="Decline this request?">
        <p className="text-ink-soft">{booking.customerName} will not get an order. You may want to message them on WhatsApp so they know.</p>
        <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button type="button" className="btn btn-outline" onClick={() => setConfirmDecline(false)}>Keep it</button>
          <button type="button" className="btn btn-primary" aria-busy={busy === "decline"} onClick={() => act("decline")}>
            {busy === "decline" ? <Loader2 aria-hidden="true" className="h-5 w-5 animate-spin" /> : null}Decline request
          </button>
        </div>
      </Modal>
    </div>
  );
}

function OrdersInner() {
  const router = useRouter();
  const params = useSearchParams();
  const { orders, pending } = useOwner();
  const today = todayLagos();

  const [tab, setTab] = useState<Tab>((params.get("tab") as Tab) || "all");
  const [q, setQ] = useState(params.get("q") ?? "");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => setPage(1), [tab, q, status]);
  const request = pending.find((b) => b.ref === selected) ?? pending[0] ?? null;

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return orders.filter((o) => {
      if (tab === "ready" && o.status !== "ready") return false;
      if (tab === "collected" && o.status !== "collected") return false;
      if (status === "overdue" ? !isOverdue(o, today) : status !== "all" && o.status !== status) return false;
      return !term || o.ref.toLowerCase().includes(term) || o.customerName.toLowerCase().includes(term) || o.phoneNormalized.includes(term.replace(/\D/g, "") || "\u0000");
    });
  }, [orders, tab, q, status, today]);

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE));
  const view = filtered.slice((page - 1) * PAGE, page * PAGE);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Orders</h1>
        <Link href="/owner/orders/new" className="btn btn-primary"><Plus aria-hidden="true" className="h-5 w-5" />New order</Link>
      </div>

      <PillTabs
        label="Order views"
        value={tab}
        onChange={(t) => { setTab(t); router.replace(t === "all" ? "/owner/orders" : `/owner/orders?tab=${t}`, { scroll: false }); }}
        items={[
          { id: "all", label: "All orders" },
          { id: "requests", label: "Booking requests", count: pending.length },
          { id: "ready", label: "Ready" },
          { id: "collected", label: "Collected" },
        ]}
      />

      {tab === "requests" ? (
        pending.length === 0 ? (
          <EmptyState icon={<Inbox aria-hidden="true" className="h-7 w-7" />} title="No booking requests waiting" text="When a customer sends a request from your public page, it shows up here." />
        ) : (
          <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[1.2fr_1fr]">
            <ul className="space-y-3">
              {pending.map((b) => (
                <li key={b.ref}>
                  <button type="button" onClick={() => setSelected(b.ref)} aria-pressed={request?.ref === b.ref} className={`w-full rounded-lg border bg-white p-4 text-left transition duration-300 hover:border-primary/50 ${request?.ref === b.ref ? "border-primary shadow-card" : "border-line"}`}>
                    <span className="flex items-center justify-between gap-3">
                      <span className="font-display font-bold">{b.ref}</span>
                      <span className="text-sm font-semibold tabular-nums">{formatNaira(b.estimatedTotal)}</span>
                    </span>
                    <span className="mt-1 block font-semibold">{b.customerName}</span>
                    <span className="block text-sm text-ink-soft">{b.items.map((i) => `${i.qty} ${i.name.toLowerCase()}`).join(", ")} &middot; wants {formatDate(b.preferredDate)}</span>
                  </button>
                </li>
              ))}
            </ul>
            {request && <RequestPanel booking={request} onDone={(ref) => { setSelected(null); if (ref) router.push(`/owner/orders/${ref}`); }} />}
          </div>
        )
      ) : (
        <section className="card overflow-hidden">
          <div className="flex flex-col gap-3 border-b border-line p-4 sm:flex-row">
            <div className="relative flex-1">
              <Search aria-hidden="true" className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft" />
              <label htmlFor="order-search" className="sr-only">Search orders</label>
              <input id="order-search" className="input pl-10" placeholder="Search by order number or customer name" value={q} onChange={(e) => setQ(e.target.value)} />
            </div>
            <div>
              <label htmlFor="order-status" className="sr-only">Filter by status</label>
              <select id="order-status" className="input sm:w-48" value={status} onChange={(e) => setStatus(e.target.value)}>
                <option value="all">Filter by status</option>
                <option value="received">Received</option>
                <option value="washing">Washing</option>
                <option value="ready">Ready</option>
                <option value="collected">Collected</option>
                <option value="overdue">Overdue</option>
              </select>
            </div>
          </div>
          {view.length === 0 ? (
            <div className="p-5">
              <EmptyState title={orders.length === 0 ? "No orders yet" : "No orders match"} text={orders.length === 0 ? "Create your first walk-in order to get started." : "Try a different search or filter."} action={orders.length === 0 ? <Link href="/owner/orders/new" className="btn btn-primary btn-sm">New order</Link> : undefined} />
            </div>
          ) : (
            <>
              <OrderTable orders={view} today={today} />
              <div className="flex items-center justify-between gap-3 border-t border-line p-4 text-sm">
                <p className="text-ink-soft">Showing {(page - 1) * PAGE + 1}&ndash;{Math.min(page * PAGE, filtered.length)} of {filtered.length} orders</p>
                <div className="flex items-center gap-1">
                  <button type="button" aria-label="Previous page" disabled={page === 1} onClick={() => setPage((p) => p - 1)} className="flex h-9 w-9 items-center justify-center rounded border border-line disabled:opacity-40"><ChevronLeft aria-hidden="true" className="h-4 w-4" /></button>
                  <span className="px-2 font-semibold">{page} / {pages}</span>
                  <button type="button" aria-label="Next page" disabled={page === pages} onClick={() => setPage((p) => p + 1)} className="flex h-9 w-9 items-center justify-center rounded border border-line disabled:opacity-40"><ChevronRight aria-hidden="true" className="h-4 w-4" /></button>
                </div>
              </div>
            </>
          )}
        </section>
      )}
    </div>
  );
}

export default function OrdersPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <OrdersInner />
    </Suspense>
  );
}
