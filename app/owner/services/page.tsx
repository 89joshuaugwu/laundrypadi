"use client";

import { Loader2, Plus, Tags, Trash2 } from "lucide-react";
import { useState, type FormEvent } from "react";
import { useOwner } from "@/components/owner/OwnerProvider";
import { Alert, EmptyState, Toggle } from "@/components/ui";
import { apiFetch } from "@/lib/api";
import { UNITS } from "@/lib/models";
import { formatNaira } from "@/lib/site";
import type { Service } from "@/lib/types";

interface Draft {
  id: string; // "" = new
  name: string;
  unit: string;
  price: string;
  active: boolean;
}

const blank: Draft = { id: "", name: "", unit: "Per item", price: "", active: true };

export default function ServicesPage() {
  const { shop } = useOwner();
  const services = shop?.services ?? [];
  const [draft, setDraft] = useState<Draft | null>(null);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState("");

  async function save(list: Service[], key: string): Promise<boolean> {
    setBusy(key);
    setError("");
    setDone("");
    try {
      await apiFetch("/api/owner/shop", { method: "PATCH", body: { services: list } });
      return true;
    } catch (e) {
      setError((e as Error).message);
      return false;
    } finally {
      setBusy("");
    }
  }

  async function onSubmit(ev: FormEvent) {
    ev.preventDefault();
    if (!draft) return;
    const price = Number(draft.price);
    if (draft.name.trim().length < 1) return setError("Give the service a name.");
    if (!Number.isInteger(price) || price < 0) return setError("Enter a price in whole naira.");
    const item = { id: draft.id, name: draft.name.trim(), unit: draft.unit, price, active: draft.active } as Service;
    const list = draft.id ? services.map((s) => (s.id === draft.id ? item : s)) : [...services, item];
    if (await save(list, "form")) {
      setDone(draft.id ? "Service updated. Changes apply to new orders." : "Service added.");
      setDraft(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Services &amp; prices</h1>
        <button type="button" className="btn btn-primary" onClick={() => { setDraft({ ...blank }); setError(""); setDone(""); }}><Plus aria-hidden="true" className="h-5 w-5" />Add service</button>
      </div>
      {done && <Alert tone="success">{done}</Alert>}
      {!draft && error && <Alert>{error}</Alert>}

      <div className="grid items-start gap-6 lg:grid-cols-[1.4fr_1fr]">
        <section className="card overflow-hidden">
          {services.length === 0 ? (
            <div className="p-5"><EmptyState icon={<Tags aria-hidden="true" className="h-7 w-7" />} title="No services yet" text="Add the items you wash and their prices. They show on your public shop page." /></div>
          ) : (
            <ul className="divide-y divide-line">
              {services.map((s) => (
                <li key={s.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3.5 sm:px-5">
                  <div className="min-w-0 flex-1"><p className="truncate font-semibold">{s.name}</p><p className="text-sm text-ink-soft">{s.unit}</p></div>
                  <p className="font-display font-bold tabular-nums">{formatNaira(s.price)}</p>
                  <Toggle label={`${s.name} is ${s.active ? "active" : "hidden"}`} checked={s.active} onChange={(v) => save(services.map((x) => (x.id === s.id ? { ...x, active: v } : x)), s.id)} />
                  <span className={`w-16 text-sm font-semibold ${s.active ? "text-primary" : "text-ink-soft"}`}>{busy === s.id ? <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" /> : s.active ? "Active" : "Hidden"}</span>
                  <button type="button" className="btn btn-outline btn-sm" onClick={() => { setDraft({ id: s.id, name: s.name, unit: s.unit, price: String(s.price), active: s.active }); setError(""); setDone(""); }}>Edit</button>
                </li>
              ))}
            </ul>
          )}
        </section>

        {draft && (
          <form onSubmit={onSubmit} noValidate className="card animate-rise space-y-4 p-5 sm:p-6 lg:sticky lg:top-24" aria-label={draft.id ? "Edit service" : "Add service"}>
            <h2 className="text-lg font-bold">{draft.id ? "Edit service" : "Add service"}</h2>
            <div><label htmlFor="sv-name" className="label">Name</label><input id="sv-name" className="input" value={draft.name} maxLength={40} onChange={(e) => setDraft({ ...draft, name: e.target.value })} placeholder="Shirts" /></div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div><label htmlFor="sv-unit" className="label">Unit</label><select id="sv-unit" className="input" value={draft.unit} onChange={(e) => setDraft({ ...draft, unit: e.target.value })}>{UNITS.map((u) => <option key={u}>{u}</option>)}</select></div>
              <div><label htmlFor="sv-price" className="label">Price (&#8358;)</label><input id="sv-price" className="input" inputMode="numeric" value={draft.price} onChange={(e) => setDraft({ ...draft, price: e.target.value.replace(/\D/g, "").slice(0, 8) })} placeholder="1000" /></div>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-canvas p-3"><span className="font-semibold">Show on shop page</span><Toggle label="Service is active" checked={draft.active} onChange={(v) => setDraft({ ...draft, active: v })} /></div>
            {error && <Alert>{error}</Alert>}
            <div className="flex flex-wrap items-center gap-3">
              <button type="button" className="btn btn-outline" onClick={() => setDraft(null)}>Cancel</button>
              <button type="submit" className="btn btn-primary" aria-busy={busy === "form"}>{busy === "form" ? <Loader2 aria-hidden="true" className="h-5 w-5 animate-spin" /> : null}Save changes</button>
              {draft.id && <button type="button" className="ml-auto inline-flex items-center gap-1.5 text-sm font-semibold text-danger" onClick={async () => { if (window.confirm(`Delete ${draft.name}? Existing orders keep their items.`)) { if (await save(services.filter((s) => s.id !== draft.id), "form")) { setDraft(null); setDone("Service deleted."); } } }}><Trash2 aria-hidden="true" className="h-4 w-4" />Delete</button>}
            </div>
            <p className="text-xs text-ink-soft">Updates apply to new orders. Existing orders keep the price they were created with.</p>
          </form>
        )}
      </div>
    </div>
  );
}
