"use client";

import { Loader2, Phone, Plus, Search, Users } from "lucide-react";
import Link from "next/link";
import { useMemo, useState, type FormEvent } from "react";
import { useOwner } from "@/components/owner/OwnerProvider";
import { StatusChip } from "@/components/StatusChip";
import { Alert, EmptyState, Modal } from "@/components/ui";
import { apiFetch } from "@/lib/api";
import { balanceOf, isOverdue } from "@/lib/models";
import { formatDate, formatNaira, maskPhone, prettyPhone, todayLagos } from "@/lib/site";
import { isValidNgPhone } from "@/lib/validate";

export default function CustomersPage() {
  const { customers, orders } = useOwner();
  const today = todayLagos();
  const [q, setQ] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const rows = useMemo(
    () =>
      customers.map((c) => {
        const mine = orders.filter((o) => o.customerId === c.id || o.phoneNormalized === c.phoneNormalized);
        return { c, mine, count: mine.length, owing: mine.reduce((s, o) => s + balanceOf(o), 0) };
      }),
    [customers, orders],
  );
  const term = q.trim().toLowerCase();
  const list = rows.filter((r) => !term || r.c.name.toLowerCase().includes(term) || r.c.phoneNormalized.includes(term.replace(/\D/g, "") || "\u0000"));
  const sel = rows.find((r) => r.c.id === selectedId) ?? list[0];

  async function onAdd(ev: FormEvent) {
    ev.preventDefault();
    setError("");
    if (name.trim().length < 2) return setError("Enter the customer's name.");
    if (!isValidNgPhone(phone)) return setError("Enter a valid Nigerian phone number, like 0803 123 4567.");
    setBusy(true);
    try {
      const res = await apiFetch<{ id: string }>("/api/owner/customers", { body: { name, phone } });
      setSelectedId(res.id);
      setAdding(false);
      setName("");
      setPhone("");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Customers</h1>
        <button type="button" className="btn btn-primary" onClick={() => { setError(""); setAdding(true); }}><Plus aria-hidden="true" className="h-5 w-5" />Add customer</button>
      </div>

      {customers.length === 0 ? (
        <EmptyState icon={<Users aria-hidden="true" className="h-7 w-7" />} title="No customers yet" text="Customers are saved automatically when you create an order, or you can add one now." action={<button type="button" className="btn btn-primary btn-sm" onClick={() => setAdding(true)}>Add customer</button>} />
      ) : (
        <div className="grid items-start gap-6 lg:grid-cols-[1.4fr_1fr]">
          <section className="card overflow-hidden">
            <div className="relative border-b border-line p-4">
              <Search aria-hidden="true" className="pointer-events-none absolute left-7 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft" />
              <label htmlFor="cust-search" className="sr-only">Search customers</label>
              <input id="cust-search" className="input pl-10" placeholder="Search by name or phone number" value={q} onChange={(e) => setQ(e.target.value)} />
            </div>
            {list.length === 0 ? <p className="p-6 text-center text-ink-soft">No customers match your search.</p> : (
              <ul className="divide-y divide-line">
                {list.map(({ c, count, owing }) => (
                  <li key={c.id}>
                    <button type="button" onClick={() => setSelectedId(c.id)} aria-pressed={sel?.c.id === c.id} className={`grid w-full grid-cols-[1fr_auto] items-center gap-x-3 px-4 py-3.5 text-left transition-colors hover:bg-mint/40 sm:grid-cols-[1.2fr_1fr_60px_100px] ${sel?.c.id === c.id ? "bg-mint/60" : ""}`}>
                      <span className="min-w-0"><span className="block truncate font-semibold">{c.name}</span><span className="block text-sm text-ink-soft sm:hidden">{maskPhone(c.phone)} &middot; {count} orders</span></span>
                      <span className="hidden text-sm text-ink-soft sm:block">{maskPhone(c.phone)}</span>
                      <span className="hidden text-sm tabular-nums sm:block">{count}</span>
                      <span className={`text-right text-sm font-semibold tabular-nums ${owing > 0 ? "text-[#8F2417]" : "text-ink-soft"}`}>{owing > 0 ? formatNaira(owing) : "\u2014"}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {sel && (
            <aside className="card space-y-5 p-5 sm:p-6 lg:sticky lg:top-24" aria-label="Customer details">
              <div className="flex items-start justify-between gap-3">
                <div><h2 className="text-xl font-bold">{sel.c.name}</h2><a href={`tel:${sel.c.phoneNormalized}`} className="mt-1 inline-flex items-center gap-1.5 text-ink-soft hover:text-primary"><Phone aria-hidden="true" className="h-4 w-4" />{prettyPhone(sel.c.phone)}</a></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg bg-canvas p-3"><p className="text-xs text-ink-soft">Total orders</p><p className="font-display text-2xl font-extrabold">{sel.count}</p></div>
                <div className="rounded-lg bg-canvas p-3"><p className="text-xs text-ink-soft">Outstanding balance</p><p className="font-display text-2xl font-extrabold tabular-nums">{formatNaira(sel.owing)}</p></div>
              </div>
              <Link href={`/owner/orders/new?customer=${encodeURIComponent(sel.c.id)}`} className="btn btn-primary w-full"><Plus aria-hidden="true" className="h-5 w-5" />New order</Link>
              <div>
                <h3 className="font-display font-bold">Recent orders</h3>
                {sel.mine.length === 0 ? <p className="mt-2 text-sm text-ink-soft">No orders yet.</p> : (
                  <ul className="mt-2 divide-y divide-line">
                    {sel.mine.slice(0, 4).map((o) => (
                      <li key={o.ref}><Link href={`/owner/orders/${o.ref}`} className="flex items-center justify-between gap-3 py-2.5 text-sm hover:text-primary"><span><span className="font-semibold">{o.ref}</span><span className="ml-2 text-ink-soft">{formatDate(o.createdAt.slice(0, 10))}</span></span><StatusChip status={isOverdue(o, today) ? "overdue" : o.status} /></Link></li>
                    ))}
                  </ul>
                )}
                {sel.mine.length > 0 && <Link href={`/owner/orders?q=${encodeURIComponent(sel.c.name)}`} className="mt-2 inline-block text-sm font-semibold text-primary underline underline-offset-4">View all orders</Link>}
              </div>
            </aside>
          )}
        </div>
      )}

      <Modal open={adding} onClose={() => setAdding(false)} title="Add customer">
        <form onSubmit={onAdd} noValidate className="space-y-4">
          <div><label htmlFor="nc-name" className="label">Name</label><input id="nc-name" className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ada Okafor" autoComplete="off" /></div>
          <div><label htmlFor="nc-phone" className="label">Phone number</label><input id="nc-phone" className="input" type="tel" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="0803 123 4567" autoComplete="off" /></div>
          {error && <Alert>{error}</Alert>}
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button type="button" className="btn btn-outline" onClick={() => setAdding(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" aria-busy={busy}>{busy ? <Loader2 aria-hidden="true" className="h-5 w-5 animate-spin" /> : null}Add customer</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
