"use client";

import { ArrowLeft, MapPin, Printer } from "lucide-react";
import { doc, onSnapshot } from "firebase/firestore";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { ProgressTracker } from "@/components/ProgressTracker";
import { Receipt } from "@/components/Receipt";
import { StatusChip } from "@/components/StatusChip";
import { EmptyState, Modal } from "@/components/ui";
import { getDb } from "@/lib/firebase";
import { balanceOf, isOverdue, toOrder, type OrderDoc } from "@/lib/models";
import { formatDate, formatNaira, todayLagos } from "@/lib/site";
import { ORDER_STEPS } from "@/lib/types";
import { waLink } from "@/lib/whatsapp";

export default function CustomerOrderPage() {
  const params = useParams<{ ref: string }>();
  const { user } = useAuth();
  const [order, setOrder] = useState<OrderDoc | null>(null);
  const [state, setState] = useState<"loading" | "ok" | "missing">("loading");
  const [showReceipt, setShowReceipt] = useState(false);

  useEffect(() => {
    const db = getDb();
    if (!db || !user) return;
    return onSnapshot(
      doc(db, "orders", decodeURIComponent(params.ref).toUpperCase()),
      (snap) => {
        if (snap.exists()) {
          setOrder(toOrder(snap.data()));
          setState("ok");
        } else setState("missing");
      },
      () => setState("missing"), // permission-denied when the order is not linked to this account
    );
  }, [params.ref, user]);

  if (state === "loading") {
    return (
      <div className="space-y-5" aria-label="Loading order">
        <div className="skeleton h-9 w-48" />
        <div className="skeleton h-28" />
        <div className="skeleton h-64" />
      </div>
    );
  }
  if (state === "missing" || !order) {
    return (
      <EmptyState
        title="We could not find that order"
        text="It may not be linked to your account. Add it from My orders using the reference and your phone number."
        action={<Link href="/account/orders" className="btn btn-primary">Back to My orders</Link>}
      />
    );
  }

  const balance = balanceOf(order);
  const idx = ORDER_STEPS.findIndex((s) => s.status === order.status);
  const overdue = isOverdue(order, todayLagos());

  return (
    <div>
      <Link href="/account/orders" className="group inline-flex items-center gap-2 text-sm font-semibold text-ink-soft hover:text-primary">
        <ArrowLeft aria-hidden="true" className="h-4 w-4 transition-transform duration-300 group-hover:-translate-x-1" />
        Back to My orders
      </Link>

      <div className="mt-4 flex flex-wrap items-center gap-3 animate-rise">
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">{order.ref}</h1>
        <StatusChip status={overdue ? "overdue" : order.status} label={!overdue && order.status === "ready" ? "Ready for collection" : undefined} />
      </div>
      <p className="mt-2 flex items-center gap-2 text-ink-soft">
        <MapPin aria-hidden="true" className="h-4 w-4" />
        {order.shopName}{order.shopArea ? `, ${order.shopArea}` : ""}
      </p>

      <div className="card mt-6 p-5 sm:p-7">
        <ProgressTracker current={idx} dates={ORDER_STEPS.map((s) => order.timeline[s.status])} />
      </div>

      <div className="mt-6 grid grid-cols-1 items-start gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-6">
          <section className="card p-5 sm:p-6">
            <h2 className="text-lg font-bold">Order details</h2>
            <table className="mt-4 w-full text-sm">
              <caption className="sr-only">Items on this order</caption>
              <thead>
                <tr className="border-b border-line text-left text-ink-soft">
                  <th className="py-2 font-medium">Item</th>
                  <th className="py-2 text-right font-medium">Qty</th>
                  <th className="py-2 text-right font-medium">Price</th>
                  <th className="py-2 text-right font-medium">Total</th>
                </tr>
              </thead>
              <tbody>
                {order.items.map((i, k) => (
                  <tr key={`${i.serviceId}-${k}`} className="border-b border-line/60">
                    <td className="py-2.5 font-medium">{i.name}</td>
                    <td className="py-2.5 text-right tabular-nums">{i.qty}</td>
                    <td className="py-2.5 text-right tabular-nums">{formatNaira(i.unitPrice)}</td>
                    <td className="py-2.5 text-right font-semibold tabular-nums">{formatNaira(i.qty * i.unitPrice)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <dl className="mt-4 space-y-3 text-sm">
              {order.collectionDate && <div className="flex justify-between gap-4"><dt className="text-ink-soft">Collection date</dt><dd className="font-semibold">{formatDate(order.collectionDate, true)}</dd></div>}
              <div className="flex justify-between gap-4"><dt className="text-ink-soft">Collection location</dt><dd className="text-right font-semibold">{order.shopName}{order.shopArea ? `, ${order.shopArea}` : ""}</dd></div>
              {order.notes && <div className="flex justify-between gap-4"><dt className="text-ink-soft">Notes</dt><dd className="text-right font-semibold">{order.notes}</dd></div>}
            </dl>
          </section>

          <section className="card p-5 sm:p-6">
            <h2 className="text-lg font-bold">Payment summary</h2>
            <dl className="mt-4 space-y-2.5">
              <div className="flex justify-between"><dt className="text-ink-soft">Total amount</dt><dd className="font-semibold tabular-nums">{formatNaira(order.total)}</dd></div>
              <div className="flex justify-between"><dt className="text-ink-soft">Amount paid</dt><dd className="font-semibold tabular-nums">{formatNaira(order.paid)}</dd></div>
              <div className="flex items-center justify-between rounded-lg bg-mint/60 px-3 py-2.5"><dt className="font-semibold">Balance</dt><dd className="font-display text-xl font-extrabold tabular-nums">{formatNaira(balance)}</dd></div>
            </dl>
            <p className="mt-3 text-sm text-ink-soft">Pay the shop directly, in cash or by bank transfer. The shop records your payment.</p>
          </section>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-24">
          <p className="text-sm font-semibold text-ink-soft">Receipt preview</p>
          <Receipt order={order} compact />
          <div className="flex flex-col gap-3">
            <button type="button" className="btn btn-primary" onClick={() => setShowReceipt(true)}>View receipt</button>
            {order.shopWhatsapp && (
              <a href={waLink(order.shopWhatsapp, `Hello ${order.shopName}, I am asking about my order ${order.ref}.`)} target="_blank" rel="noopener noreferrer" className="btn btn-outline">
                Contact shop
              </a>
            )}
          </div>
        </aside>
      </div>

      <Modal open={showReceipt} onClose={() => setShowReceipt(false)} title="Receipt" wide>
        <Receipt order={order} />
        <button type="button" className="btn btn-primary mt-5 w-full" onClick={() => window.print()}>
          <Printer aria-hidden="true" className="h-5 w-5" /> Print or save as PDF
        </button>
      </Modal>
    </div>
  );
}
