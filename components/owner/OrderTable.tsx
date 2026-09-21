"use client";

import Link from "next/link";
import { StatusChip } from "../StatusChip";
import { balanceOf, isOverdue, type OrderDoc } from "@/lib/models";
import { formatDate, formatNaira } from "@/lib/site";

const cols = "sm:grid-cols-[90px_1.2fr_1.1fr_100px_110px_110px]";

/** Responsive order list: a table on wide screens, stacked cards on phones. */
export function OrderTable({ orders, today }: { orders: OrderDoc[]; today: string }) {
  return (
    <div>
      <div className={`hidden gap-3 border-b border-line px-4 pb-2 text-xs font-semibold text-ink-soft sm:grid ${cols}`} aria-hidden="true">
        <span>Order</span><span>Customer</span><span>Items</span><span>Due date</span><span className="text-right">Balance</span><span>Status</span>
      </div>
      <ul className="divide-y divide-line">
        {orders.map((o) => {
          const bal = balanceOf(o);
          return (
            <li key={o.ref}>
              <Link href={`/owner/orders/${o.ref}`} className={`grid grid-cols-[1fr_auto] items-center gap-x-3 gap-y-1 px-4 py-3.5 text-sm transition-colors hover:bg-mint/40 ${cols}`}>
                <span className="font-display font-bold">{o.ref}</span>
                <span className="justify-self-end sm:order-none sm:justify-self-start sm:row-auto row-start-1"><span className="sr-only">Status: </span>
                  <span className="sm:hidden"><StatusChip status={isOverdue(o, today) ? "overdue" : o.status} /></span>
                </span>
                <span className="col-span-2 min-w-0 sm:col-span-1 sm:col-start-2 sm:row-start-1">
                  <span className="block truncate font-semibold">{o.customerName}</span>
                  <span className="block truncate text-xs text-ink-soft sm:hidden">{o.itemsLabel} &middot; {o.collectionDate ? formatDate(o.collectionDate) : ""}</span>
                </span>
                <span className="hidden truncate text-ink-soft sm:col-start-3 sm:row-start-1 sm:block">{o.itemsLabel}</span>
                <span className="hidden text-ink-soft sm:col-start-4 sm:row-start-1 sm:block">{o.collectionDate ? formatDate(o.collectionDate) : "\u2014"}</span>
                <span className={`hidden text-right font-semibold tabular-nums sm:col-start-5 sm:row-start-1 sm:block ${bal > 0 ? "" : "text-ink-soft"}`}>{bal > 0 ? formatNaira(bal) : "\u2014"}</span>
                <span className="hidden sm:col-start-6 sm:row-start-1 sm:block"><StatusChip status={isOverdue(o, today) ? "overdue" : o.status} /></span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
