"use client";

import { AlertCircle, Info, Loader2, MapPin, Search } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { formatDate, formatNaira } from "@/lib/site";
import { ORDER_STEPS, type TrackedOrder } from "@/lib/types";
import { isValidNgPhone } from "@/lib/validate";
import { waLink } from "@/lib/whatsapp";
import { ProgressTracker } from "./ProgressTracker";
import { StatusChip } from "./StatusChip";

export function TrackForm() {
  const params = useSearchParams();
  const [ref, setRef] = useState(params.get("ref") ?? "");
  const [phone, setPhone] = useState("");
  const [website, setWebsite] = useState(""); // honeypot
  const [errors, setErrors] = useState<{ ref?: string; phone?: string }>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [order, setOrder] = useState<TrackedOrder | null>(null);
  const resultRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (order) {
      resultRef.current?.focus();
      resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [order]);

  async function onSubmit(ev: FormEvent) {
    ev.preventDefault();
    const e: typeof errors = {};
    if (!/^[A-Za-z]{2}-?\s?\d{2,8}$/.test(ref.trim())) e.ref = "Enter your order reference, like LP-1042.";
    if (!isValidNgPhone(phone)) e.phone = "Enter the phone number used for the booking.";
    setErrors(e);
    setError("");
    if (Object.keys(e).length > 0) return;

    setLoading(true);
    setOrder(null);
    try {
      const res = await fetch("/api/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ref, phone, website }),
      });
      const data = (await res.json()) as { ok: boolean; order?: TrackedOrder; error?: string };
      if (res.ok && data.ok && data.order) setOrder(data.order);
      else setError(data.error ?? "No results found. Check the order reference and phone number.");
    } catch {
      setError("We could not reach the server. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  const currentIdx = order ? ORDER_STEPS.findIndex((s) => s.status === order.status) : -1;
  const balance = order ? Math.max(0, order.total - order.paid) : 0;

  return (
    <div className="container-page grid items-start gap-6 py-8 sm:py-12 lg:grid-cols-[1fr_1.25fr]">
      {/* Form */}
      <div className="card animate-rise p-5 sm:p-7">
        <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">Track your order</h1>
        <p className="mt-2 text-ink-soft">Enter your order reference and phone number to check the latest status.</p>

        <form onSubmit={onSubmit} noValidate className="mt-6 space-y-5">
          <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
            <label>
              Website
              <input type="text" name="website" tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} />
            </label>
          </div>

          <div>
            <label htmlFor="tr-ref" className="label">Order reference (e.g. LP-1042)</label>
            <input id="tr-ref" className="input uppercase placeholder:normal-case" autoCapitalize="characters" autoComplete="off" value={ref} onChange={(e) => setRef(e.target.value)} aria-invalid={!!errors.ref} aria-describedby={errors.ref ? "tr-ref-err" : undefined} placeholder="LP-1042" />
            {errors.ref && <p id="tr-ref-err" role="alert" className="field-error"><AlertCircle aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />{errors.ref}</p>}
          </div>

          <div>
            <label htmlFor="tr-phone" className="label">Phone number used for the booking</label>
            <input id="tr-phone" className="input" type="tel" inputMode="tel" autoComplete="tel" value={phone} onChange={(e) => setPhone(e.target.value)} aria-invalid={!!errors.phone} aria-describedby={errors.phone ? "tr-phone-err" : undefined} placeholder="0803 123 4567" />
            {errors.phone && <p id="tr-phone-err" role="alert" className="field-error"><AlertCircle aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />{errors.phone}</p>}
          </div>

          {error && (
            <div role="alert" className="flex items-start gap-3 rounded-lg border border-danger/30 bg-[#FDF0EE] p-4 text-sm text-danger">
              <AlertCircle aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0" />
              <p>{error}</p>
            </div>
          )}

          <button type="submit" aria-busy={loading} className="btn btn-primary w-full">
            {loading ? (<><Loader2 aria-hidden="true" className="h-5 w-5 animate-spin" />Checking</>) : (<><Search aria-hidden="true" className="h-5 w-5" />Track order</>)}
          </button>
        </form>

        <div className="mt-6 flex gap-3 rounded-lg bg-canvas p-4 text-sm text-ink-soft">
          <Info aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
          <p>
            <span className="font-semibold text-ink">Can&rsquo;t find your order?</span> Check the reference and phone number, or contact the shop directly. Your reference is on your receipt or booking message.
          </p>
        </div>
      </div>

      {/* Result */}
      <div aria-live="polite">
        {loading ? (
          <div className="card space-y-5 p-5 sm:p-7" aria-label="Loading your order">
            <div className="skeleton h-6 w-32" />
            <div className="skeleton h-9 w-56" />
            <div className="skeleton h-16 w-full" />
            <div className="skeleton h-32 w-full" />
          </div>
        ) : order ? (
          <div className="card animate-rise p-5 sm:p-7">
            <p className="text-sm font-semibold text-primary">Order found</p>
            <div className="mt-1 flex flex-wrap items-center gap-3">
              <h2 ref={resultRef} tabIndex={-1} className="text-3xl font-extrabold tracking-tight outline-none">{order.ref}</h2>
              <StatusChip key={order.status} status={order.status} label={order.status === "ready" ? "Ready for collection" : undefined} className="animate-pop" />
            </div>
            <p className="mt-2 flex items-center gap-2 text-ink-soft">
              <MapPin aria-hidden="true" className="h-4 w-4 shrink-0" />
              {order.shopName}{order.shopArea ? `, ${order.shopArea}` : ""}
            </p>

            <div className="mt-7">
              <ProgressTracker current={currentIdx} dates={ORDER_STEPS.map((s) => order.timeline[s.status])} />
            </div>

            <dl className="mt-7 divide-y divide-line rounded-lg border border-line">
              {[
                ...(order.itemsLabel ? [{ k: "Items", v: order.itemsLabel }] : []),
                ...(order.collectionDate ? [{ k: "Collection date", v: formatDate(order.collectionDate, true) }] : []),
                { k: "Total amount", v: formatNaira(order.total) },
                { k: "Amount paid", v: formatNaira(order.paid) },
              ].map((row) => (
                <div key={row.k} className="flex justify-between gap-4 px-4 py-3">
                  <dt className="text-ink-soft">{row.k}</dt>
                  <dd className="text-right font-semibold tabular-nums">{row.v}</dd>
                </div>
              ))}
              <div className="flex justify-between gap-4 bg-mint/50 px-4 py-3">
                <dt className="font-semibold">Balance</dt>
                <dd className="font-display text-lg font-extrabold tabular-nums">{formatNaira(balance)}</dd>
              </div>
            </dl>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              {order.shopWhatsapp && (
                <a href={waLink(order.shopWhatsapp, `Hello ${order.shopName}, I am asking about my order ${order.ref}.`)} target="_blank" rel="noopener noreferrer" className="btn btn-primary">
                  Contact shop
                </a>
              )}
              <button type="button" className="btn btn-outline" onClick={() => { setOrder(null); setRef(""); setPhone(""); }}>
                Track another order
              </button>
            </div>
          </div>
        ) : (
          <div className="card p-5 sm:p-7">
            <h2 className="text-xl font-bold">Your order will appear here</h2>
            <p className="mt-1 text-ink-soft">Every order moves through these four steps.</p>
            <div className="mt-7 opacity-80">
              <ProgressTracker current={-1} animateIn={false} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
