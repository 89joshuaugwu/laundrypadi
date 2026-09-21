"use client";

import Image from "next/image";
import { formatDate, formatNaira } from "@/lib/site";
import { balanceOf, type OrderDoc } from "@/lib/models";

/** Printable receipt. `id=receipt-print` is what the print stylesheet isolates. */
export function Receipt({ order, compact = false }: { order: OrderDoc; compact?: boolean }) {
  const created = order.createdAt ? formatDate(order.createdAt.slice(0, 10), true) : "";
  return (
    <div id="receipt-print" className={`rounded-lg border border-line bg-white ${compact ? "p-4 text-sm" : "p-6"} shadow-card`}>
      <Image src="/images/logo.png" alt="LaundryPadi" width={1000} height={232} className="h-9 w-auto" />
      <p className="mt-4 font-display text-lg font-bold">Receipt</p>
      <dl className={`mt-3 space-y-1 ${compact ? "text-xs" : "text-sm"}`}>
        <div className="flex justify-between gap-3"><dt className="text-ink-soft">Order no.</dt><dd className="font-semibold">{order.ref}</dd></div>
        <div className="flex justify-between gap-3"><dt className="text-ink-soft">Shop</dt><dd className="text-right font-semibold">{order.shopName}</dd></div>
        {order.customerName && <div className="flex justify-between gap-3"><dt className="text-ink-soft">Customer</dt><dd className="text-right font-semibold">{order.customerName}</dd></div>}
        {created && <div className="flex justify-between gap-3"><dt className="text-ink-soft">Date</dt><dd className="font-semibold">{created}</dd></div>}
      </dl>

      <table className={`mt-4 w-full ${compact ? "text-xs" : "text-sm"}`}>
        <caption className="sr-only">Items on this order</caption>
        <thead>
          <tr className="border-b border-line text-left text-ink-soft">
            <th className="py-2 font-medium">Item</th>
            <th className="py-2 text-right font-medium">Qty</th>
            <th className="py-2 text-right font-medium">Amount</th>
          </tr>
        </thead>
        <tbody>
          {order.items.map((i, idx) => (
            <tr key={`${i.serviceId}-${idx}`} className="border-b border-line/60">
              <td className="py-2">{i.name}</td>
              <td className="py-2 text-right tabular-nums">{i.qty}</td>
              <td className="py-2 text-right tabular-nums">{formatNaira(i.qty * i.unitPrice)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <dl className={`mt-3 space-y-1 ${compact ? "text-xs" : "text-sm"}`}>
        <div className="flex justify-between"><dt className="text-ink-soft">Total</dt><dd className="font-semibold tabular-nums">{formatNaira(order.total)}</dd></div>
        <div className="flex justify-between"><dt className="text-ink-soft">Paid</dt><dd className="font-semibold tabular-nums">{formatNaira(order.paid)}</dd></div>
        <div className="flex justify-between border-t border-line pt-2 text-base"><dt className="font-semibold">Balance</dt><dd className="font-display font-extrabold tabular-nums">{formatNaira(balanceOf(order))}</dd></div>
      </dl>
      <p className="mt-4 text-xs text-ink-soft">Not a valid receipt for payment. For reference only.</p>
    </div>
  );
}
