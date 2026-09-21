"use client";

import { ClipboardList, Settings, Tags, Users, BarChart3 } from "lucide-react";
import { useEffect, useState } from "react";
import type { OrderStatus } from "@/lib/types";
import { ORDER_STEPS } from "@/lib/types";
import { StatusChip } from "./StatusChip";

interface Row {
  ref: string;
  name: string;
  items: string;
  due: string;
  status: OrderStatus;
}

const base: Row[] = [
  { ref: "LP-1042", name: "Ada Okafor", items: "5 shirts", due: "Sep 23, 2026", status: "ready" },
  { ref: "LP-1041", name: "Chinedu Eze", items: "2 trousers", due: "Sep 22, 2026", status: "washing" },
  { ref: "LP-1040", name: "Amaka Udo", items: "1 duvet", due: "Sep 24, 2026", status: "received" },
  { ref: "LP-1039", name: "Kelechi Nwosu", items: "4 shirts", due: "Sep 20, 2026", status: "collected" },
];

const tabs: { label: string; match: OrderStatus | null }[] = [
  { label: "All", match: null },
  { label: "New", match: "received" },
  { label: "In progress", match: "washing" },
  { label: "Ready", match: "ready" },
  { label: "Completed", match: "collected" },
];

const nav = [
  { label: "Orders", Icon: ClipboardList },
  { label: "Customers", Icon: Users },
  { label: "Price list", Icon: Tags },
  { label: "Reports", Icon: BarChart3 },
  { label: "Settings", Icon: Settings },
];

/** An illustrative preview of the owner's orders screen. One order keeps moving through the statuses. */
export function DashboardMock() {
  const [tab, setTab] = useState(0);
  const live = 1; // index of the row that advances

  const [rows, setRows] = useState<Row[]>(base);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = setInterval(() => {
      setRows((prev) =>
        prev.map((r, i) => {
          if (i !== live) return r;
          const idx = ORDER_STEPS.findIndex((s) => s.status === r.status);
          return { ...r, status: ORDER_STEPS[(idx + 1) % ORDER_STEPS.length].status };
        }),
      );
    }, 2800);
    return () => clearInterval(id);
  }, [live]);

  const active = tabs[tab].match;
  const visible = rows.filter((r) => active === null || r.status === active);

  return (
    <div className="card overflow-hidden" role="group" aria-label="Preview of the shop owner orders screen (illustrative)">
      <div className="flex items-center justify-between border-b border-line px-4 py-3">
        <div className="flex items-center gap-2 font-display text-sm font-bold">
          <span className="flex h-6 w-6 items-center justify-center rounded bg-primary text-[11px] text-white">F</span>
          FreshFold Laundry
        </div>
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-mint-deep font-display text-xs font-bold text-primary-dark">FL</span>
          <span className="hidden text-xs leading-tight sm:block">
            <span className="block font-semibold">FreshFold Laundry</span>
            <span className="text-ink-soft">Shop owner</span>
          </span>
        </div>
      </div>

      <div className="flex">
        <nav aria-hidden="true" className="hidden w-40 shrink-0 space-y-1 border-r border-line p-3 sm:block">
          {nav.map(({ label, Icon }, i) => (
            <div
              key={label}
              className={`flex items-center gap-2 rounded px-2.5 py-2 text-sm ${i === 0 ? "bg-mint font-semibold text-primary-dark" : "text-ink-soft"}`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </div>
          ))}
        </nav>

        <div className="min-w-0 flex-1 p-4">
          <p className="font-display text-lg font-bold">Orders</p>

          <div role="tablist" aria-label="Filter orders" className="mt-3 flex gap-1 overflow-x-auto rounded border border-line bg-canvas p-1">
            {tabs.map((t, i) => (
              <button
                key={t.label}
                role="tab"
                type="button"
                aria-selected={tab === i}
                onClick={() => setTab(i)}
                className={`whitespace-nowrap rounded px-3 py-1.5 text-xs font-semibold transition-colors duration-200 ${
                  tab === i ? "bg-white text-primary-dark shadow-sm" : "text-ink-soft hover:text-ink"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <ul className="mt-2 min-h-[212px] divide-y divide-line">
            {visible.length === 0 ? (
              <li className="flex h-[212px] flex-col items-center justify-center text-center">
                <p className="font-display font-semibold">No orders here yet</p>
                <p className="mt-1 text-sm text-ink-soft">Orders appear as soon as they reach this step.</p>
              </li>
            ) : (
              visible.map((r) => (
                <li key={r.ref} className="grid grid-cols-[1fr_auto] items-center gap-x-3 gap-y-1 py-3 text-sm sm:grid-cols-[84px_1fr_88px_88px_88px]">
                  <span className="hidden text-xs text-ink-soft sm:block">{r.ref}</span>
                  <span className="font-semibold">{r.name}</span>
                  <span className="hidden text-ink-soft sm:block">{r.items}</span>
                  <span className="justify-self-end sm:justify-self-start">
                    <StatusChip key={r.status} status={r.status} label={r.status === "received" ? "New" : undefined} className="animate-pop" />
                  </span>
                  <span className="col-span-2 text-xs text-ink-soft sm:col-span-1 sm:text-right sm:text-sm">
                    <span className="sm:hidden">
                      {r.ref} &middot; {r.items} &middot;{" "}
                    </span>
                    {r.due}
                  </span>
                </li>
              ))
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}
