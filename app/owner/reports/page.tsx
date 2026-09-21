"use client";

import { Download, Receipt as ReceiptIcon, Wallet, Wallet2 } from "lucide-react";
import { useMemo, useState } from "react";
import { useOwner } from "@/components/owner/OwnerProvider";
import { EmptyState, StatCard } from "@/components/ui";
import { balanceOf, METHOD_LABEL } from "@/lib/models";
import { formatDate, formatNaira, todayLagos } from "@/lib/site";

const lagosDay = (iso: string) => new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Lagos" }).format(new Date(iso));
const shift = (d: string, n: number) => {
  const [y, m, day] = d.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, day + n)).toISOString().slice(0, 10);
};
const csv = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;

export default function ReportsPage() {
  const { orders, shop } = useOwner();
  const today = todayLagos();
  const [from, setFrom] = useState(shift(today, -29));
  const [to, setTo] = useState(today);

  const preset = (v: string) => {
    if (v === "7") { setFrom(shift(today, -6)); setTo(today); }
    if (v === "30") { setFrom(shift(today, -29)); setTo(today); }
    if (v === "month") { setFrom(`${today.slice(0, 8)}01`); setTo(today); }
  };

  const data = useMemo(() => {
    const start = from <= to ? from : to;
    let end = from <= to ? to : from;
    if (shift(start, 61) < end) end = shift(start, 61); // charts stay readable: max 62 days
    const inRange = (d: string) => d >= start && d <= end;

    const ordersIn = orders.filter((o) => o.createdAt && inRange(lagosDay(o.createdAt)));
    const ledger = orders
      .flatMap((o) => o.payments.map((p) => ({ ...p, ref: o.ref, customer: o.customerName, day: lagosDay(p.at) })))
      .filter((p) => inRange(p.day))
      .sort((a, b) => b.at.localeCompare(a.at));

    const days: { day: string; total: number }[] = [];
    for (let d = start; d <= end; d = shift(d, 1)) days.push({ day: d, total: 0 });
    ledger.forEach((p) => { const slot = days.find((x) => x.day === p.day); if (slot) slot.total += p.amount; });

    return {
      start, end, days, ledger,
      orderValue: ordersIn.reduce((s, o) => s + o.total, 0),
      received: ledger.reduce((s, p) => s + p.amount, 0),
      outstanding: ordersIn.reduce((s, o) => s + balanceOf(o), 0),
    };
  }, [orders, from, to]);

  const max = Math.max(1, ...data.days.map((d) => d.total));
  const step = Math.ceil(data.days.length / 8);

  function exportCsv() {
    const lines = ["Date,Order,Customer,Method,Amount (NGN)", ...data.ledger.map((p) => [p.day, p.ref, p.customer, METHOD_LABEL[p.method], p.amount].map(csv).join(","))];
    const url = URL.createObjectURL(new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `${shop?.slug ?? "laundrypadi"}-payments-${data.start}-to-${data.end}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Reports</h1>
        <div className="flex flex-wrap items-end gap-3">
          <div><label htmlFor="rp-preset" className="label">Range</label><select id="rp-preset" className="input h-10 w-40" defaultValue="30" onChange={(e) => preset(e.target.value)}><option value="7">Last 7 days</option><option value="30">Last 30 days</option><option value="month">This month</option></select></div>
          <div><label htmlFor="rp-from" className="label">From</label><input id="rp-from" type="date" className="input h-10" max={to} value={from} onChange={(e) => setFrom(e.target.value)} /></div>
          <div><label htmlFor="rp-to" className="label">To</label><input id="rp-to" type="date" className="input h-10" min={from} max={today} value={to} onChange={(e) => setTo(e.target.value)} /></div>
          <button type="button" className="btn btn-primary h-10" onClick={exportCsv} disabled={data.ledger.length === 0}><Download aria-hidden="true" className="h-4 w-4" />Export CSV</button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard icon={<ReceiptIcon aria-hidden="true" className="h-6 w-6" />} label="Order value" value={formatNaira(data.orderValue)} tone="blue" />
        <StatCard icon={<Wallet aria-hidden="true" className="h-6 w-6" />} label="Payments received" value={formatNaira(data.received)} />
        <StatCard icon={<Wallet2 aria-hidden="true" className="h-6 w-6" />} label="Outstanding" value={formatNaira(data.outstanding)} tone={data.outstanding > 0 ? "red" : "mint"} />
      </div>

      <section className="card p-5 sm:p-6">
        <h2 className="text-lg font-bold">Payments received by day</h2>
        {data.received === 0 ? (
          <div className="mt-4"><EmptyState title="No payments in this period" text="Payments you record on orders appear here." /></div>
        ) : (
          <div className="mt-5 flex gap-3">
            <div className="flex h-48 flex-col justify-between pb-6 text-right text-xs text-ink-soft" aria-hidden="true"><span>{formatNaira(max)}</span><span>{formatNaira(Math.round(max / 2))}</span><span>&#8358;0</span></div>
            <div className="min-w-0 flex-1 overflow-x-auto">
              <div className="flex h-48 items-end gap-1 border-b border-line pb-6" style={{ minWidth: data.days.length * 16 }} role="img" aria-label={`Bar chart of payments received per day, ${formatNaira(data.received)} in total`}>
                {data.days.map((d, i) => (
                  <div key={d.day} className="group relative flex h-full flex-1 flex-col justify-end">
                    <div title={`${formatDate(d.day)}: ${formatNaira(d.total)}`} className="w-full origin-bottom animate-grow rounded-t bg-primary/85 transition-colors group-hover:bg-primary-dark" style={{ height: `${d.total ? Math.max(3, (d.total / max) * 100) : 0}%`, animationDelay: `${i * 18}ms` }} />
                    {i % step === 0 && <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap text-[11px] text-ink-soft">{formatDate(d.day)}</span>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </section>

      <section className="card overflow-hidden">
        <h2 className="p-5 pb-3 text-lg font-bold">Payments ledger</h2>
        {data.ledger.length === 0 ? <p className="px-5 pb-6 text-ink-soft">Nothing recorded between {formatDate(data.start)} and {formatDate(data.end)}.</p> : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-sm">
              <caption className="sr-only">Payments received in the selected period</caption>
              <thead><tr className="border-y border-line text-left text-ink-soft"><th className="px-5 py-2.5 font-medium">Date</th><th className="py-2.5 font-medium">Order</th><th className="py-2.5 font-medium">Customer</th><th className="py-2.5 font-medium">Method</th><th className="px-5 py-2.5 text-right font-medium">Amount</th></tr></thead>
              <tbody>{data.ledger.map((p) => <tr key={`${p.ref}-${p.id}`} className="border-b border-line/60"><td className="px-5 py-2.5">{formatDate(p.day)}</td><td className="py-2.5 font-semibold">{p.ref}</td><td className="py-2.5">{p.customer}</td><td className="py-2.5">{METHOD_LABEL[p.method]}</td><td className="px-5 py-2.5 text-right font-semibold tabular-nums">{formatNaira(p.amount)}</td></tr>)}</tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
