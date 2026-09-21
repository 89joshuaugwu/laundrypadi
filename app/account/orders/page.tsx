"use client";

import { ArrowRight, Loader2, Plus, ShoppingBasket } from "lucide-react";
import Link from "next/link";
import { useState, type FormEvent } from "react";
import { useAuth } from "@/components/AuthProvider";
import { StatusChip } from "@/components/StatusChip";
import { useMyOrders } from "@/components/useMyOrders";
import { Alert, EmptyState, PillTabs } from "@/components/ui";
import { apiFetch } from "@/lib/api";
import { balanceOf, isOverdue, type OrderDoc } from "@/lib/models";
import { formatDate, formatNaira, todayLagos } from "@/lib/site";
import { isValidNgPhone } from "@/lib/validate";

function OrderRow({ o, today, index }: { o: OrderDoc; today: string; index: number }) {
  const balance = balanceOf(o);
  return (
    <li className="animate-rise" style={{ animationDelay: `${Math.min(index, 8) * 50}ms` }}>
      <Link
        href={`/account/orders/${o.ref}`}
        className="group grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-2 rounded-lg border border-line bg-white p-4 transition duration-300 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-card sm:grid-cols-[110px_1.4fr_110px_140px_130px_auto] sm:px-5"
      >
        <span className="font-display font-bold">{o.ref}</span>
        <span className="col-span-2 row-start-2 min-w-0 sm:col-span-1 sm:row-start-auto">
          <span className="block truncate font-semibold">{o.shopName}</span>
          <span className="block truncate text-sm text-ink-soft">{o.itemsLabel}</span>
        </span>
        <span className="justify-self-end sm:justify-self-start">
          <StatusChip status={isOverdue(o, today) ? "overdue" : o.status} />
        </span>
        <span className="text-sm text-ink-soft">{o.collectionDate ? `Due ${formatDate(o.collectionDate, true)}` : ""}</span>
        <span className={`text-sm font-semibold ${balance > 0 ? "text-ink" : "text-primary"}`}>{balance > 0 ? `${formatNaira(balance)} balance` : "Paid"}</span>
        <span className="col-start-2 row-start-1 hidden items-center gap-1 justify-self-end text-sm font-semibold text-primary sm:col-auto sm:row-auto sm:flex">
          View order <ArrowRight aria-hidden="true" className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
        </span>
      </Link>
    </li>
  );
}

export default function MyOrdersPage() {
  const { user, profile } = useAuth();
  const { orders, bookings, loading, error } = useMyOrders();
  const [tab, setTab] = useState<"active" | "past">("active");
  const today = todayLagos();

  const [showAdd, setShowAdd] = useState(false);
  const [ref, setRef] = useState("");
  const [phone, setPhone] = useState("");
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState("");
  const [addDone, setAddDone] = useState("");

  const active = orders.filter((o) => o.status !== "collected");
  const past = orders.filter((o) => o.status === "collected");
  const shown = tab === "active" ? active : past;
  const pending = bookings.filter((b) => b.status === "pending");
  const first = (profile?.name || user?.displayName || user?.email?.split("@")[0] || "there").split(" ")[0];

  async function onAdd(ev: FormEvent) {
    ev.preventDefault();
    setAddError("");
    setAddDone("");
    if (!/^[A-Za-z]{2}-?\s?\d{2,8}$/.test(ref.trim())) return setAddError("Enter the order reference, like LP-1042.");
    if (!isValidNgPhone(phone)) return setAddError("Enter the phone number the shop has for you.");
    setAdding(true);
    try {
      const res = await apiFetch<{ ref: string }>("/api/account/claim", { body: { ref, phone } });
      setAddDone(`${res.ref} was added to your orders.`);
      setRef("");
      setPhone("");
    } catch (e) {
      setAddError((e as Error).message);
    } finally {
      setAdding(false);
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="animate-rise text-3xl font-extrabold tracking-tight sm:text-4xl">Hello, {first}</h1>
          <p className="mt-1 animate-rise text-ink-soft" style={{ animationDelay: "80ms" }}>Here are your laundry orders.</p>
        </div>
        <button type="button" onClick={() => setShowAdd((v) => !v)} aria-expanded={showAdd} className="btn btn-outline btn-sm">
          <Plus aria-hidden="true" className="h-4 w-4" /> Add an order
        </button>
      </div>

      <div className={`grid transition-[grid-template-rows] duration-300 ease-out ${showAdd ? "mt-5 grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
        <div className="overflow-hidden">
          <form onSubmit={onAdd} noValidate className="card space-y-4 p-5" aria-hidden={!showAdd}>
            <p className="text-ink-soft">Have an order from a shop that was not booked here? Add it with the reference on your receipt and the phone number the shop has for you.</p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="add-ref" className="label">Order reference</label>
                <input id="add-ref" className="input uppercase placeholder:normal-case" value={ref} onChange={(e) => setRef(e.target.value)} placeholder="LP-1042" tabIndex={showAdd ? 0 : -1} />
              </div>
              <div>
                <label htmlFor="add-phone" className="label">Phone number</label>
                <input id="add-phone" className="input" type="tel" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="0803 123 4567" tabIndex={showAdd ? 0 : -1} />
              </div>
            </div>
            {addError && <Alert>{addError}</Alert>}
            {addDone && <Alert tone="success">{addDone}</Alert>}
            <button type="submit" aria-busy={adding} className="btn btn-primary btn-sm" tabIndex={showAdd ? 0 : -1}>
              {adding ? (<><Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />Adding</>) : "Add order"}
            </button>
          </form>
        </div>
      </div>

      <div className="mt-7">
        <PillTabs
          label="Order filter"
          value={tab}
          onChange={setTab}
          items={[
            { id: "active", label: `Active (${active.length})` },
            { id: "past", label: `Past (${past.length})` },
          ]}
        />
      </div>

      <div className="mt-5" aria-live="polite">
        {error ? (
          <Alert>{error}</Alert>
        ) : loading ? (
          <ul className="space-y-3" aria-label="Loading orders">
            {[0, 1, 2].map((i) => <li key={i} className="skeleton h-20" />)}
          </ul>
        ) : shown.length === 0 ? (
          <EmptyState
            icon={<ShoppingBasket aria-hidden="true" className="h-7 w-7" />}
            title={tab === "active" ? "Your orders will appear here" : "No past orders yet"}
            text={tab === "active" ? "Book a laundry at your favourite shop to get started." : "Orders you have collected will be listed here."}
          />
        ) : (
          <ul className="space-y-3">{shown.map((o, i) => <OrderRow key={o.ref} o={o} today={today} index={i} />)}</ul>
        )}
      </div>

      {pending.length > 0 && (
        <section className="mt-10">
          <h2 className="text-xl font-bold">Awaiting shop confirmation</h2>
          <p className="mt-1 text-ink-soft">These requests become orders once the shop confirms the price and date.</p>
          <ul className="mt-4 space-y-3">
            {pending.map((b) => (
              <li key={b.ref} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-line bg-white p-4">
                <div>
                  <p className="font-display font-bold">{b.ref}</p>
                  <p className="text-sm text-ink-soft">{b.items.map((i) => `${i.qty} ${i.name.toLowerCase()}`).join(", ")}</p>
                </div>
                <span className="rounded-full bg-citrus/50 px-3 py-1 text-xs font-semibold">Pending</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
