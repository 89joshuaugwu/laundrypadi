"use client";

import { Download, Wallet } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Alert, EmptyState, StatCard } from "@/components/ui";
import { apiFetch } from "@/lib/api";
import { formatDate, formatNaira, todayLagos } from "@/lib/site";

interface Payment { reference: string; shopName: string; shopSlug: string; purpose: "setup" | "subscription"; amount: number; paidAt: string }

const shift = (d: string, n: number) => {
  const [y, m, day] = d.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, day + n)).toISOString().slice(0, 10);
};
const csv = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;

export default function AdminPaymentsPage() {
  const today = todayLagos();
  const [from, setFrom] = useState(shift(today, -29));
  const [to, setTo] = useState(today);
  const [payments, setPayments] = useState<Payment[] | null>(null);
  const [error, setError] = useState("");

  function load(f: string, t: string) {
    setPayments(null);
    apiFetch<{ payments: Payment[] }>(`/api/admin/payments?from=${f}&to=${t}`, { method: "GET" })
      .then((res) => setPayments(res.payments))
      .catch((e: Error) => setError(e.message));
  }
  useEffect(() => load(from, to), []); // eslint-disable-line react-hooks/exhaustive-deps

  const preset = (v: string) => {
    let f = from;
    const t = today;
    if (v === "7") f = shift(today, -6);
    if (v === "30") f = shift(today, -29);
    if (v === "month") f = `${today.slice(0, 8)}01`;
    setFrom(f);
    setTo(t);
    load(f, t);
  };

  const total = (payments ?? []).reduce((s, p) => s + p.amount, 0);
  const setupTotal = (payments ?? []).filter((p) => p.purpose === "setup").reduce((s, p) => s + p.amount, 0);

  function exportCsv() {
    const lines = ["Date,Shop,Purpose,Amount (NGN),Reference", ...(payments ?? []).map((p) => [p.paidAt.slice(0, 10), p.shopName, p.purpose === "setup" ? "Setup fee" : "Monthly plan", p.amount, p.reference].map(csv).join(","))];
    const url = URL.createObjectURL(new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `laundrypadi-revenue-${from}-to-${to}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Payments</h1>
        <div className="flex flex-wrap items-end gap-3">
          <div><label htmlFor="ap-preset" className="label">Range</label><select id="ap-preset" className="input h-10 w-40" defaultValue="30" onChange={(e) => preset(e.target.value)}><option value="7">Last 7 days</option><option value="30">Last 30 days</option><option value="month">This month</option></select></div>
          <div><label htmlFor="ap-from" className="label">From</label><input id="ap-from" type="date" className="input h-10" max={to} value={from} onChange={(e) => { setFrom(e.target.value); load(e.target.value, to); }} /></div>
          <div><label htmlFor="ap-to" className="label">To</label><input id="ap-to" type="date" className="input h-10" min={from} max={today} value={to} onChange={(e) => { setTo(e.target.value); load(from, e.target.value); }} /></div>
          <button type="button" className="btn btn-primary h-10" onClick={exportCsv} disabled={!payments?.length}><Download aria-hidden="true" className="h-4 w-4" />Export CSV</button>
        </div>
      </div>

      {error && <Alert>{error}</Alert>}

      <div className="grid gap-4 sm:grid-cols-2">
        <StatCard icon={<Wallet aria-hidden="true" className="h-6 w-6" />} label="Total revenue in range" value={formatNaira(total)} />
        <StatCard icon={<Wallet aria-hidden="true" className="h-6 w-6" />} label="Setup fees in range" value={formatNaira(setupTotal)} tone="blue" />
      </div>

      <section className="card overflow-hidden">
        <h2 className="p-5 pb-3 text-lg font-bold">Ledger</h2>
        {!payments ? (
          <div className="space-y-2 p-5"><div className="skeleton h-10" /><div className="skeleton h-10" /><div className="skeleton h-10" /></div>
        ) : payments.length === 0 ? (
          <div className="p-5"><EmptyState title="No payments in this range" /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-sm">
              <caption className="sr-only">LaundryPadi revenue in the selected period</caption>
              <thead><tr className="border-y border-line text-left text-ink-soft"><th className="px-5 py-2.5 font-medium">Date</th><th className="py-2.5 font-medium">Shop</th><th className="py-2.5 font-medium">Type</th><th className="px-5 py-2.5 text-right font-medium">Amount</th></tr></thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p.reference} className="border-b border-line/60">
                    <td className="px-5 py-2.5">{formatDate(p.paidAt.slice(0, 10))}</td>
                    <td className="py-2.5"><Link href="/admin/shops" className="font-semibold hover:text-primary">{p.shopName || "Unknown shop"}</Link></td>
                    <td className="py-2.5">{p.purpose === "setup" ? "Setup fee" : "Monthly plan"}</td>
                    <td className="px-5 py-2.5 text-right font-semibold tabular-nums">{formatNaira(p.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
