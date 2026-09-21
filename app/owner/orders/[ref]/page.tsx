"use client";

import { ArrowLeft, Check, ChevronDown, Copy, CreditCard, Loader2, MessageCircle, Phone, Printer, Receipt as ReceiptIcon } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { useOwner } from "@/components/owner/OwnerProvider";
import { ProgressTracker } from "@/components/ProgressTracker";
import { Receipt } from "@/components/Receipt";
import { StatusChip } from "@/components/StatusChip";
import { Alert, EmptyState, Modal } from "@/components/ui";
import { apiFetch } from "@/lib/api";
import { balanceOf, isOverdue, METHOD_LABEL, type OrderDoc } from "@/lib/models";
import { formatDate, formatDateTime, formatNaira, prettyPhone, site, todayLagos } from "@/lib/site";
import { ORDER_STEPS, type OrderStatus } from "@/lib/types";
import { waLink } from "@/lib/whatsapp";

function whatsappText(o: OrderDoc): string {
  const first = o.customerName.split(" ")[0];
  const track = `${site.url}/track?ref=${o.ref}`;
  const bal = balanceOf(o);
  const owe = bal > 0 ? ` Balance to pay: ${formatNaira(bal)}.` : "";
  switch (o.status) {
    case "received":
      return `Hello ${first}, ${o.shopName} has received your order ${o.ref} (${o.itemsLabel}).${o.collectionDate ? ` It should be ready by ${formatDate(o.collectionDate, true)}.` : ""} Track it any time: ${track}`;
    case "washing":
      return `Hello ${first}, your order ${o.ref} is being washed at ${o.shopName}. Track it here: ${track}`;
    case "ready":
      return `Hello ${first}, your order ${o.ref} is ready for collection at ${o.shopName}.${owe}`;
    default:
      return `Hello ${first}, thank you for choosing ${o.shopName}! Your order ${o.ref} has been collected.`;
  }
}

const nextLabel: Record<OrderStatus, string | null> = {
  received: "Start washing",
  washing: "Mark as ready",
  ready: "Mark as collected",
  collected: null,
};

export default function OrderDetailPage() {
  const params = useParams<{ ref: string }>();
  const { orders, loading } = useOwner();
  const order = orders.find((o) => o.ref === decodeURIComponent(params.ref).toUpperCase());

  const [menu, setMenu] = useState(false);
  const menuBox = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [payOpen, setPayOpen] = useState(false);
  const [receiptOpen, setReceiptOpen] = useState(false);
  const [dateOpen, setDateOpen] = useState(false);
  const [confirmCollect, setConfirmCollect] = useState(false);
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<"cash" | "transfer">("cash");
  const [newDate, setNewDate] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!menu) return;
    const down = (e: MouseEvent) => !menuBox.current?.contains(e.target as Node) && setMenu(false);
    const key = (e: KeyboardEvent) => e.key === "Escape" && setMenu(false);
    document.addEventListener("mousedown", down);
    document.addEventListener("keydown", key);
    return () => {
      document.removeEventListener("mousedown", down);
      document.removeEventListener("keydown", key);
    };
  }, [menu]);

  if (!order) {
    return loading ? <div className="skeleton h-64" /> : (
      <EmptyState title="We could not find that order" action={<Link href="/owner/orders" className="btn btn-primary">Back to orders</Link>} />
    );
  }

  const balance = balanceOf(order);
  const idx = ORDER_STEPS.findIndex((s) => s.status === order.status);
  const overdue = isOverdue(order, todayLagos());
  const next = ORDER_STEPS[idx + 1];

  async function patch(body: Record<string, unknown>) {
    setBusy(true);
    setError("");
    try {
      await apiFetch(`/api/owner/orders/${order!.ref}`, { method: "PATCH", body });
      return true;
    } catch (e) {
      setError((e as Error).message);
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function changeStatus(status: OrderStatus) {
    setMenu(false);
    if (status === "collected" && balance > 0) return setConfirmCollect(true);
    await patch({ action: "status", status });
  }

  async function onPay(ev: FormEvent) {
    ev.preventDefault();
    if (await patch({ action: "payment", amount, method })) setPayOpen(false);
  }

  return (
    <div className="space-y-6">
      <Link href="/owner/orders" className="group inline-flex items-center gap-2 text-sm font-semibold text-ink-soft hover:text-primary">
        <ArrowLeft aria-hidden="true" className="h-4 w-4 transition-transform group-hover:-translate-x-1" />Back to orders
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">{order.ref}</h1>
            <StatusChip key={order.status} status={overdue ? "overdue" : order.status} label={!overdue && order.status === "ready" ? "Ready for collection" : undefined} className="animate-pop" />
          </div>
          <p className="mt-2 font-semibold">{order.customerName}</p>
          <a href={`tel:${order.phoneNormalized}`} className="mt-0.5 inline-flex items-center gap-1.5 text-ink-soft hover:text-primary"><Phone aria-hidden="true" className="h-4 w-4" />{prettyPhone(order.phone)}</a>
        </div>

        <div className="flex items-center gap-2">
          {next && (
            <button type="button" className="btn btn-primary" aria-busy={busy} onClick={() => changeStatus(next.status)}>
              {busy ? <Loader2 aria-hidden="true" className="h-5 w-5 animate-spin" /> : <Check aria-hidden="true" className="h-5 w-5" />}
              {nextLabel[order.status]}
            </button>
          )}
          <div ref={menuBox} className="relative">
            <button type="button" className="btn btn-outline" aria-expanded={menu} aria-haspopup="menu" onClick={() => setMenu((v) => !v)}>
              Actions <ChevronDown aria-hidden="true" className={`h-4 w-4 transition-transform ${menu ? "rotate-180" : ""}`} />
            </button>
            {menu && (
              <div role="menu" className="absolute right-0 top-14 z-20 w-60 animate-rise rounded-lg border border-line bg-white p-1.5 shadow-card">
                {ORDER_STEPS.filter((s) => s.status !== order.status).map((s) => (
                  <button key={s.status} role="menuitem" type="button" className="w-full rounded px-3 py-2.5 text-left text-sm font-medium hover:bg-mint" onClick={() => changeStatus(s.status)}>Set status: {s.label}</button>
                ))}
                <button role="menuitem" type="button" className="w-full rounded px-3 py-2.5 text-left text-sm font-medium hover:bg-mint" onClick={() => { setMenu(false); setNewDate(order.collectionDate); setDateOpen(true); }}>Change collection date</button>
                <button
                  role="menuitem"
                  type="button"
                  className="flex w-full items-center gap-2 rounded px-3 py-2.5 text-left text-sm font-medium hover:bg-mint"
                  onClick={async () => {
                    try { await navigator.clipboard.writeText(`${window.location.origin}/track?ref=${order.ref}`); setCopied(true); setTimeout(() => setCopied(false), 1800); } catch { /* clipboard blocked */ }
                    setMenu(false);
                  }}
                >
                  <Copy aria-hidden="true" className="h-4 w-4" />Copy tracking link
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {copied && <Alert tone="success">Tracking link copied. Customers still need their phone number to open it.</Alert>}
      {error && <Alert>{error}</Alert>}

      <div className="card p-5 sm:p-7">
        <ProgressTracker current={idx} dates={ORDER_STEPS.map((s) => order.timeline[s.status])} />
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[1.5fr_1fr]">
        <section className="card p-5 sm:p-6">
          <h2 className="text-lg font-bold">Order items</h2>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[420px] text-sm">
              <caption className="sr-only">Items on this order</caption>
              <thead><tr className="border-b border-line text-left text-ink-soft"><th className="py-2 font-medium">Service</th><th className="py-2 text-right font-medium">Qty</th><th className="py-2 text-right font-medium">Price (&#8358;)</th><th className="py-2 text-right font-medium">Total (&#8358;)</th></tr></thead>
              <tbody>
                {order.items.map((i, k) => (
                  <tr key={`${i.serviceId}-${k}`} className="border-b border-line/60"><td className="py-2.5 font-medium">{i.name}</td><td className="py-2.5 text-right tabular-nums">{i.qty}</td><td className="py-2.5 text-right tabular-nums">{new Intl.NumberFormat("en-NG").format(i.unitPrice)}</td><td className="py-2.5 text-right font-semibold tabular-nums">{new Intl.NumberFormat("en-NG").format(i.qty * i.unitPrice)}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
          <dl className="mt-4 space-y-2">
            <div className="flex justify-between"><dt className="text-ink-soft">Subtotal</dt><dd className="font-semibold tabular-nums">{formatNaira(order.total)}</dd></div>
            <div className="flex justify-between"><dt className="text-ink-soft">Amount paid</dt><dd className="font-semibold tabular-nums">{formatNaira(order.paid)}</dd></div>
            <div className="flex justify-between rounded-lg bg-mint/60 px-3 py-2.5"><dt className="font-semibold">Balance</dt><dd className="font-display text-xl font-extrabold tabular-nums">{formatNaira(balance)}</dd></div>
          </dl>
          {order.collectionDate && <p className="mt-4 text-sm text-ink-soft">Collection date: <span className="font-semibold text-ink">{formatDate(order.collectionDate, true)}</span></p>}
          {order.notes && <p className="mt-2 rounded bg-canvas p-3 text-sm">&ldquo;{order.notes}&rdquo;</p>}

          <div className="mt-6 flex flex-wrap gap-3">
            <button type="button" className="btn btn-primary btn-sm" disabled={balance === 0} onClick={() => { setAmount(String(balance)); setMethod("cash"); setError(""); setPayOpen(true); }}><CreditCard aria-hidden="true" className="h-4 w-4" />Record payment</button>
            <button type="button" className="btn btn-outline btn-sm" onClick={() => setReceiptOpen(true)}><ReceiptIcon aria-hidden="true" className="h-4 w-4" />View receipt</button>
            <a href={waLink(order.phone, whatsappText(order))} target="_blank" rel="noopener noreferrer" className="btn btn-outline btn-sm"><MessageCircle aria-hidden="true" className="h-4 w-4" />Prepare WhatsApp message</a>
          </div>
          <p className="mt-2 text-xs text-ink-soft">WhatsApp opens a draft that you send yourself.</p>
        </section>

        <section className="card p-5 sm:p-6">
          <h2 className="text-lg font-bold">Activity log</h2>
          <ol className="mt-4 space-y-4">
            {[...order.activity].reverse().map((a, i) => (
              <li key={`${a.at}-${i}`} className="relative flex gap-3">
                <span className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full bg-primary" aria-hidden="true" />
                <div><p className="text-sm font-semibold">{a.text}</p><p className="text-xs text-ink-soft">{formatDateTime(a.at)}</p></div>
              </li>
            ))}
          </ol>
          {order.payments.length > 0 && (
            <>
              <h3 className="mt-6 font-display font-bold">Payments</h3>
              <ul className="mt-2 divide-y divide-line text-sm">
                {order.payments.map((p) => <li key={p.id} className="flex justify-between py-2"><span className="text-ink-soft">{formatDateTime(p.at)} &middot; {METHOD_LABEL[p.method]}</span><span className="font-semibold tabular-nums">{formatNaira(p.amount)}</span></li>)}
              </ul>
            </>
          )}
        </section>
      </div>

      <Modal open={payOpen} onClose={() => setPayOpen(false)} title="Record payment">
        <form onSubmit={onPay} noValidate className="space-y-4">
          <div>
            <label htmlFor="pay-amt" className="label">Amount (&#8358;)</label>
            <input id="pay-amt" className="input" inputMode="numeric" value={amount} onChange={(e) => setAmount(e.target.value.replace(/\D/g, ""))} />
            <p className="field-hint">Balance on this order: {formatNaira(balance)}</p>
          </div>
          <div>
            <label htmlFor="pay-method" className="label">Payment method</label>
            <select id="pay-method" className="input" value={method} onChange={(e) => setMethod(e.target.value as "cash" | "transfer")}><option value="cash">Cash</option><option value="transfer">Bank transfer</option></select>
            <p className="field-hint">This updates the amount paid for this order. Confirm the money has arrived first.</p>
          </div>
          {error && <Alert>{error}</Alert>}
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button type="button" className="btn btn-outline" onClick={() => setPayOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" aria-busy={busy}>{busy ? <Loader2 aria-hidden="true" className="h-5 w-5 animate-spin" /> : null}Save payment</button>
          </div>
        </form>
      </Modal>

      <Modal open={receiptOpen} onClose={() => setReceiptOpen(false)} title="Receipt" wide>
        <Receipt order={order} />
        <button type="button" className="btn btn-primary mt-5 w-full" onClick={() => window.print()}><Printer aria-hidden="true" className="h-5 w-5" />Print or save as PDF</button>
      </Modal>

      <Modal open={dateOpen} onClose={() => setDateOpen(false)} title="Change collection date">
        <label htmlFor="new-date" className="label">Collection date</label>
        <input id="new-date" type="date" className="input" value={newDate} onChange={(e) => setNewDate(e.target.value)} />
        {error && <div className="mt-3"><Alert>{error}</Alert></div>}
        <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button type="button" className="btn btn-outline" onClick={() => setDateOpen(false)}>Cancel</button>
          <button type="button" className="btn btn-primary" aria-busy={busy} onClick={async () => { if (await patch({ action: "update", collectionDate: newDate })) setDateOpen(false); }}>Save date</button>
        </div>
      </Modal>

      <Modal open={confirmCollect} onClose={() => setConfirmCollect(false)} title="Balance still unpaid">
        <p className="text-ink-soft">{order.customerName} still owes {formatNaira(balance)}. Mark this order as collected anyway?</p>
        <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button type="button" className="btn btn-outline" onClick={() => setConfirmCollect(false)}>Not yet</button>
          <button type="button" className="btn btn-primary" onClick={async () => { setConfirmCollect(false); await patch({ action: "status", status: "collected" }); }}>Mark as collected</button>
        </div>
      </Modal>
    </div>
  );
}
