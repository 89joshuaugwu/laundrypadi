"use client";

import { AlertCircle, ArrowLeft, Loader2, Plus, Trash2, UserPlus } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState, type FormEvent } from "react";
import { useOwner } from "@/components/owner/OwnerProvider";
import { Alert, PageSkeleton } from "@/components/ui";
import { apiFetch } from "@/lib/api";
import { formatNaira, prettyPhone, todayLagos } from "@/lib/site";
import { isValidNgPhone } from "@/lib/validate";

interface Row {
  key: number;
  serviceId: string; // "" = other item
  name: string;
  qty: string;
  price: string;
}

let keySeed = 1;

function NewOrderInner() {
  const router = useRouter();
  const params = useSearchParams();
  const { shop, customers } = useOwner();
  const services = useMemo(() => (shop?.services ?? []).filter((s) => s.active), [shop]);

  const [customerId, setCustomerId] = useState(params.get("customer") ?? "");
  const [isNew, setIsNew] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [rows, setRows] = useState<Row[]>([]);
  const [date, setDate] = useState("");
  const [notes, setNotes] = useState("");
  const [paid, setPaid] = useState("");
  const [method, setMethod] = useState<"cash" | "transfer">("cash");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const d = new Date(Date.now() + 2 * 86400000);
    setDate(new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Lagos" }).format(d));
  }, []);

  useEffect(() => {
    if (rows.length === 0) {
      const s = services[0];
      setRows([{ key: keySeed++, serviceId: s?.id ?? "", name: "", qty: "1", price: s ? String(s.price) : "" }]);
    }
  }, [services, rows.length]);

  const num = (v: string) => (v === "" ? 0 : Number(v));
  const total = rows.reduce((sum, r) => sum + num(r.qty) * num(r.price), 0);
  const paidNum = Math.min(num(paid), total);
  const balance = total - paidNum;

  function patch(key: number, p: Partial<Row>) {
    setRows((rs) => rs.map((r) => (r.key === key ? { ...r, ...p } : r)));
  }
  function pickService(key: number, serviceId: string) {
    const s = services.find((x) => x.id === serviceId);
    patch(key, { serviceId, price: s ? String(s.price) : "", name: s ? "" : "" });
  }

  async function onSubmit(ev: FormEvent) {
    ev.preventDefault();
    setError("");
    if (isNew || !customerId) {
      if (name.trim().length < 2) return setError("Enter the customer's name, or pick an existing customer.");
      if (!isValidNgPhone(phone)) return setError("Enter a valid Nigerian phone number for the customer.");
    }
    if (rows.some((r) => !r.serviceId && !r.name.trim())) return setError("Give every custom item a name.");
    if (rows.some((r) => num(r.qty) < 1)) return setError("Every item needs a quantity of at least 1.");
    if (total <= 0) return setError("The order total is \u20A60. Check your prices.");
    if (num(paid) > total) return setError("The amount paid cannot be more than the total.");

    setBusy(true);
    try {
      const res = await apiFetch<{ ref: string }>("/api/owner/orders", {
        body: {
          ...(isNew || !customerId ? { name, phone } : { customerId }),
          items: rows.map((r) => ({ serviceId: r.serviceId || undefined, name: r.name, qty: num(r.qty), unitPrice: num(r.price) })),
          collectionDate: date,
          notes,
          paidAmount: paidNum,
          method,
        },
      });
      router.push(`/owner/orders/${res.ref}`);
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <Link href="/owner/orders" className="group inline-flex items-center gap-2 text-sm font-semibold text-ink-soft hover:text-primary">
        <ArrowLeft aria-hidden="true" className="h-4 w-4 transition-transform group-hover:-translate-x-1" />Back to orders
      </Link>
      <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">New order</h1>

      <form onSubmit={onSubmit} noValidate className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[1.5fr_1fr]">
        <div className="space-y-6">
          <section className="card space-y-4 p-5 sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-bold">Customer details</h2>
              <button type="button" onClick={() => { setIsNew((v) => !v); setCustomerId(""); }} className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary">
                <UserPlus aria-hidden="true" className="h-4 w-4" />{isNew ? "Choose existing" : "Add customer"}
              </button>
            </div>
            {!isNew && customers.length > 0 && (
              <div>
                <label htmlFor="cu-pick" className="label">Search existing customer</label>
                <select id="cu-pick" className="input" value={customerId} onChange={(e) => setCustomerId(e.target.value)}>
                  <option value="">Select a customer</option>
                  {customers.map((c) => <option key={c.id} value={c.id}>{c.name} ({prettyPhone(c.phone)})</option>)}
                </select>
              </div>
            )}
            {(isNew || customers.length === 0 || !customerId) && (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="cu-name" className="label">Name</label>
                  <input id="cu-name" className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ada Okafor" autoComplete="off" />
                </div>
                <div>
                  <label htmlFor="cu-phone" className="label">Phone number</label>
                  <input id="cu-phone" className="input" type="tel" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="0803 123 4567" autoComplete="off" />
                </div>
              </div>
            )}
          </section>

          <section className="card p-5 sm:p-6">
            <h2 className="text-lg font-bold">Items</h2>
            <ul className="mt-4 space-y-3">
              {rows.map((r) => (
                <li key={r.key} className="grid grid-cols-2 items-end gap-3 rounded-lg border border-line p-3 sm:grid-cols-[1.4fr_70px_110px_100px_auto] sm:border-0 sm:p-0">
                  <div className="col-span-2 sm:col-span-1">
                    <label htmlFor={`sv-${r.key}`} className="label sm:sr-only">Service</label>
                    <select id={`sv-${r.key}`} className="input" value={r.serviceId} onChange={(e) => pickService(r.key, e.target.value)}>
                      {services.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                      <option value="">Other item</option>
                    </select>
                    {!r.serviceId && <input aria-label="Item name" className="input mt-2" placeholder="Item name" value={r.name} onChange={(e) => patch(r.key, { name: e.target.value })} />}
                  </div>
                  <div>
                    <label htmlFor={`q-${r.key}`} className="label sm:sr-only">Qty</label>
                    <input id={`q-${r.key}`} className="input" inputMode="numeric" value={r.qty} onChange={(e) => patch(r.key, { qty: e.target.value.replace(/\D/g, "").slice(0, 3) })} />
                  </div>
                  <div>
                    <label htmlFor={`p-${r.key}`} className="label sm:sr-only">Price (&#8358;)</label>
                    <input id={`p-${r.key}`} className="input" inputMode="numeric" value={r.price} onChange={(e) => patch(r.key, { price: e.target.value.replace(/\D/g, "").slice(0, 8) })} />
                  </div>
                  <p className="text-right font-semibold tabular-nums sm:pb-3.5">{formatNaira(num(r.qty) * num(r.price))}</p>
                  <button type="button" aria-label="Remove item" disabled={rows.length === 1} onClick={() => setRows((rs) => rs.filter((x) => x.key !== r.key))} className="flex h-12 w-10 items-center justify-center justify-self-end rounded text-ink-soft hover:text-danger disabled:opacity-30">
                    <Trash2 aria-hidden="true" className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
            <button type="button" className="btn btn-outline btn-sm mt-4" onClick={() => { const s = services[0]; setRows((rs) => [...rs, { key: keySeed++, serviceId: s?.id ?? "", name: "", qty: "1", price: s ? String(s.price) : "" }]); }}>
              <Plus aria-hidden="true" className="h-4 w-4" />Add item
            </button>
          </section>

          <section className="card grid grid-cols-1 gap-4 p-5 sm:grid-cols-2 sm:p-6">
            <div>
              <label htmlFor="o-date" className="label">Collection date</label>
              <input id="o-date" type="date" className="input" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="o-notes" className="label">Notes <span className="font-normal text-ink-soft">(optional)</span></label>
              <textarea id="o-notes" className="input" maxLength={500} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Please handle with care. Thank you!" />
            </div>
          </section>
        </div>

        <aside aria-label="Order summary" className="card space-y-4 p-5 sm:p-6 lg:sticky lg:top-24">
          <h2 className="text-lg font-bold">Order summary</h2>
          <dl className="space-y-2">
            <div className="flex justify-between"><dt className="text-ink-soft">Subtotal</dt><dd className="font-semibold tabular-nums">{formatNaira(total)}</dd></div>
            <div className="flex items-center justify-between gap-3"><dt className="text-ink-soft"><label htmlFor="o-paid">Amount paid (&#8358;)</label></dt><dd><input id="o-paid" className="input h-10 w-32 text-right" inputMode="numeric" value={paid} onChange={(e) => setPaid(e.target.value.replace(/\D/g, "").slice(0, 8))} placeholder="0" /></dd></div>
            <div className="flex justify-between rounded-lg bg-mint/60 px-3 py-2.5"><dt className="font-semibold">Balance</dt><dd className="font-display text-xl font-extrabold tabular-nums">{formatNaira(balance)}</dd></div>
          </dl>
          <fieldset>
            <legend className="label">Payment method</legend>
            <div className="grid grid-cols-2 gap-2">
              {(["cash", "transfer"] as const).map((m) => (
                <label key={m} className={`flex cursor-pointer items-center gap-2 rounded border p-3 text-sm font-semibold has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-primary ${method === m ? "border-primary bg-mint/60" : "border-line"}`}>
                  <input type="radio" name="method" checked={method === m} onChange={() => setMethod(m)} className="h-4 w-4 accent-[#087F6D]" />
                  {m === "cash" ? "Cash" : "Bank transfer"}
                </label>
              ))}
            </div>
            <p className="field-hint">Only recorded if an amount is paid. Confirm the money has arrived first.</p>
          </fieldset>
          {error && <Alert><AlertCircle className="hidden" aria-hidden="true" />{error}</Alert>}
          <button type="submit" aria-busy={busy} className="btn btn-primary w-full">
            {busy ? (<><Loader2 aria-hidden="true" className="h-5 w-5 animate-spin" />Creating order</>) : "Create order & receipt"}
          </button>
        </aside>
      </form>
    </div>
  );
}

export default function NewOrderPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <NewOrderInner />
    </Suspense>
  );
}
