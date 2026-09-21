"use client";

import { AlertCircle, ArrowLeft, Check, Loader2, MessageCircle, Minus, Pencil, Plus } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { formatDate, formatNaira } from "@/lib/site";
import type { Service } from "@/lib/types";
import { isValidNgPhone } from "@/lib/validate";
import { waLink } from "@/lib/whatsapp";

interface WizardShop {
  slug: string;
  name: string;
  area: string;
  whatsapp: string;
  services: Service[];
}

type Errors = Partial<Record<"name" | "phone" | "items" | "date", string>>;

const STEPS = ["Details", "Items", "Review"] as const;

export function BookingWizard({ shop }: { shop: WizardShop }) {
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [qty, setQty] = useState<Record<string, number>>({});
  const [date, setDate] = useState("");
  const [notes, setNotes] = useState("");
  const [website, setWebsite] = useState(""); // honeypot
  const [errors, setErrors] = useState<Errors>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [result, setResult] = useState<{ ref: string; demo: boolean } | null>(null);
  const [today, setToday] = useState("");
  const headingRef = useRef<HTMLHeadingElement>(null);
  const firstRender = useRef(true);

  useEffect(() => {
    const d = new Date();
    setToday(new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10));
  }, []);

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    headingRef.current?.focus();
  }, [step, result]);

  const lines = useMemo(
    () => shop.services.filter((s) => (qty[s.id] ?? 0) > 0).map((s) => ({ service: s, qty: qty[s.id] })),
    [shop.services, qty],
  );
  const total = lines.reduce((sum, l) => sum + l.qty * l.service.price, 0);
  const itemsLabel = lines.map((l) => `${l.qty} \u00D7 ${l.service.name}`).join(", ");

  function setItemQty(id: string, next: number) {
    setQty((q) => ({ ...q, [id]: Math.max(0, Math.min(99, next)) }));
    setErrors((e) => ({ ...e, items: undefined }));
  }

  function validate(target: number): Errors {
    const e: Errors = {};
    if (target === 0) {
      if (name.trim().length < 2) e.name = "Enter your full name.";
      if (!isValidNgPhone(phone)) e.phone = "Enter a valid Nigerian number, like 0803 123 4567.";
    }
    if (target === 1) {
      if (lines.length === 0) e.items = "Add at least one item to continue.";
      if (!date) e.date = "Choose a preferred collection date.";
      else if (today && date < today) e.date = "Choose today or a later date.";
    }
    return e;
  }

  function next() {
    const e = validate(step);
    setErrors(e);
    if (Object.keys(e).length === 0) setStep((s) => Math.min(2, s + 1));
  }

  async function onSubmit(ev: FormEvent) {
    ev.preventDefault();
    if (step < 2) return next();
    const e = { ...validate(0), ...validate(1) };
    setErrors(e);
    if (Object.keys(e).length > 0) {
      setStep(e.name || e.phone ? 0 : 1);
      return;
    }

    setSubmitting(true);
    setSubmitError("");
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shopSlug: shop.slug,
          name,
          phone,
          date,
          notes,
          website,
          items: lines.map((l) => ({ serviceId: l.service.id, qty: l.qty })),
        }),
      });
      const data = (await res.json()) as { ok: boolean; ref?: string; error?: string; demo?: boolean };
      if (!res.ok || !data.ok || !data.ref) {
        setSubmitError(data.error ?? "We could not send your request. Please try again.");
      } else {
        setResult({ ref: data.ref, demo: Boolean(data.demo) });
      }
    } catch {
      setSubmitError("We could not reach the server. Check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  /* ---------- Success ---------- */
  if (result) {
    const message = `Hello ${shop.name}, I just sent a booking request on LaundryPadi.\nReference: ${result.ref}\nItems: ${itemsLabel}\nPreferred collection date: ${formatDate(date, true)}\nName: ${name}`;
    return (
      <div className="container-page py-10 sm:py-16">
        <div className="card mx-auto max-w-xl p-6 text-center sm:p-10">
          <span className="mx-auto flex h-16 w-16 animate-pop items-center justify-center rounded-full bg-primary text-white">
            <Check aria-hidden="true" className="h-8 w-8" strokeWidth={3} />
          </span>
          <h1 ref={headingRef} tabIndex={-1} className="mt-6 text-3xl font-extrabold tracking-tight outline-none">
            Request sent
          </h1>
          <p className="mt-2 font-semibold text-primary">Awaiting shop confirmation</p>
          <p className="mx-auto mt-3 max-w-sm text-ink-soft">
            {shop.name} will confirm the final price and your collection date. Keep this reference handy.
          </p>

          <p className="mx-auto mt-6 w-fit rounded-lg bg-mint px-6 py-3 font-display text-2xl font-extrabold tracking-wide">
            {result.ref}
          </p>

          <dl className="mt-6 space-y-2 rounded-lg bg-canvas p-4 text-left text-sm">
            <div className="flex justify-between gap-4"><dt className="text-ink-soft">Items</dt><dd className="text-right font-semibold">{itemsLabel}</dd></div>
            <div className="flex justify-between gap-4"><dt className="text-ink-soft">Preferred collection</dt><dd className="font-semibold">{formatDate(date, true)}</dd></div>
            <div className="flex justify-between gap-4"><dt className="text-ink-soft">Estimated total</dt><dd className="font-semibold">{formatNaira(total)}</dd></div>
          </dl>

          {result.demo && (
            <p className="mt-4 rounded-lg bg-citrus/40 p-3 text-sm text-ink" role="note">
              Demo mode: this request was not saved because Firebase Admin is not configured yet.
            </p>
          )}

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            {shop.whatsapp && (
              <a href={waLink(shop.whatsapp, message)} target="_blank" rel="noopener noreferrer" className="btn btn-primary">
                <MessageCircle aria-hidden="true" className="h-5 w-5" />
                Message the shop
              </a>
            )}
            <Link href={`/s/${shop.slug}`} className="btn btn-outline">
              Back to shop
            </Link>
          </div>
          <p className="mt-4 text-sm text-ink-soft">WhatsApp opens a prepared message. You tap Send.</p>
        </div>
      </div>
    );
  }

  /* ---------- Form ---------- */
  return (
    <div className="container-page py-8 sm:py-12">
      <Link href={`/s/${shop.slug}`} className="group inline-flex items-center gap-2 text-sm font-semibold text-ink-soft transition-colors hover:text-primary">
        <ArrowLeft aria-hidden="true" className="h-4 w-4 transition-transform duration-300 group-hover:-translate-x-1" />
        {shop.name}
      </Link>

      {/* Stepper */}
      <ol aria-label="Booking steps" className="mx-auto mt-6 flex max-w-2xl items-center">
        {STEPS.map((label, i) => {
          const done = i < step;
          const current = i === step;
          return (
            <li key={label} className="flex flex-1 items-center last:flex-none" aria-current={current ? "step" : undefined}>
              <button
                type="button"
                disabled={i >= step}
                onClick={() => setStep(i)}
                className="group flex items-center gap-2 disabled:cursor-default"
              >
                <span
                  className={`flex h-9 w-9 items-center justify-center rounded-full border-2 font-display text-sm font-bold transition-all duration-500 ${
                    done ? "border-primary bg-primary text-white" : current ? "border-primary bg-white text-primary animate-pulse-ring" : "border-line bg-white text-ink-soft"
                  }`}
                >
                  {done ? <Check aria-hidden="true" className="h-4 w-4" strokeWidth={3} /> : i + 1}
                </span>
                <span className={`hidden text-sm font-semibold sm:block ${current || done ? "text-ink" : "text-ink-soft"}`}>{label}</span>
                <span className="sr-only sm:hidden">{label}</span>
              </button>
              {i < STEPS.length - 1 && (
                <span aria-hidden="true" className="mx-3 h-[3px] flex-1 overflow-hidden rounded-full bg-line">
                  <span className="block h-full origin-left bg-primary transition-transform duration-700 ease-out" style={{ transform: `scaleX(${i < step ? 1 : 0})` }} />
                </span>
              )}
            </li>
          );
        })}
      </ol>

      <form onSubmit={onSubmit} noValidate className="mt-8 grid items-start gap-6 lg:grid-cols-[1.45fr_1fr]">
        <div className="card p-5 sm:p-7">
          <h1 ref={headingRef} tabIndex={-1} className="text-2xl font-extrabold tracking-tight outline-none">
            {step === 0 && "Your details"}
            {step === 1 && "What are you dropping off?"}
            {step === 2 && "Review your booking request"}
          </h1>

          {/* Honeypot: hidden from people and assistive tech, bots fill it */}
          <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
            <label>
              Website
              <input type="text" name="website" tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} />
            </label>
          </div>

          {/* Step 1 */}
          {step === 0 && (
            <div className="mt-6 space-y-5 animate-rise">
              <div>
                <label htmlFor="bk-name" className="label">Your name</label>
                <input id="bk-name" className="input" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} aria-invalid={!!errors.name} aria-describedby={errors.name ? "bk-name-err" : undefined} placeholder="Ada Okafor" />
                {errors.name && <p id="bk-name-err" role="alert" className="field-error"><AlertCircle aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />{errors.name}</p>}
              </div>
              <div>
                <label htmlFor="bk-phone" className="label">Phone number</label>
                <input id="bk-phone" className="input" type="tel" inputMode="tel" autoComplete="tel" value={phone} onChange={(e) => setPhone(e.target.value)} aria-invalid={!!errors.phone} aria-describedby={errors.phone ? "bk-phone-err" : "bk-phone-hint"} placeholder="0803 123 4567" />
                {errors.phone ? (
                  <p id="bk-phone-err" role="alert" className="field-error"><AlertCircle aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />{errors.phone}</p>
                ) : (
                  <p id="bk-phone-hint" className="field-hint">You will use this number to track your order.</p>
                )}
              </div>
              <div>
                <label htmlFor="bk-drop" className="label">Drop-off location</label>
                <select id="bk-drop" className="input" defaultValue="shop">
                  <option value="shop">At the shop ({shop.area})</option>
                </select>
              </div>
            </div>
          )}

          {/* Step 2 */}
          {step === 1 && (
            <div className="mt-6 space-y-6 animate-rise">
              <fieldset>
                <legend className="label">Items</legend>
                {shop.services.length === 0 ? (
                  <p className="rounded-lg bg-canvas p-4 text-ink-soft">This shop has not published prices yet. Please contact the shop directly.</p>
                ) : (
                  <ul className="divide-y divide-line rounded-lg border border-line">
                    {shop.services.map((s) => {
                      const q = qty[s.id] ?? 0;
                      return (
                        <li key={s.id} className={`flex items-center justify-between gap-3 px-4 py-3 transition-colors duration-300 ${q > 0 ? "bg-mint/50" : ""}`}>
                          <div>
                            <p className="font-semibold">{s.name}</p>
                            <p className="text-sm text-ink-soft">{formatNaira(s.price)} {s.unit}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <button type="button" aria-label={`Remove one ${s.name}`} disabled={q === 0} onClick={() => setItemQty(s.id, q - 1)} className="flex h-10 w-10 items-center justify-center rounded border border-line bg-white transition hover:border-primary hover:text-primary disabled:opacity-40 disabled:hover:border-line disabled:hover:text-inherit">
                              <Minus aria-hidden="true" className="h-4 w-4" />
                            </button>
                            <output aria-live="polite" aria-label={`${s.name} quantity`} className="w-8 text-center font-display text-lg font-bold tabular-nums">{q}</output>
                            <button type="button" aria-label={`Add one ${s.name}`} onClick={() => setItemQty(s.id, q + 1)} className="flex h-10 w-10 items-center justify-center rounded border border-line bg-white transition hover:border-primary hover:text-primary">
                              <Plus aria-hidden="true" className="h-4 w-4" />
                            </button>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
                {errors.items && <p role="alert" className="field-error"><AlertCircle aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />{errors.items}</p>}
              </fieldset>

              <div>
                <label htmlFor="bk-date" className="label">Preferred collection date</label>
                <input id="bk-date" type="date" className="input" min={today || undefined} value={date} onChange={(e) => { setDate(e.target.value); setErrors((x) => ({ ...x, date: undefined })); }} aria-invalid={!!errors.date} aria-describedby={errors.date ? "bk-date-err" : undefined} />
                {errors.date && <p id="bk-date-err" role="alert" className="field-error"><AlertCircle aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />{errors.date}</p>}
              </div>

              <div>
                <label htmlFor="bk-notes" className="label">Additional notes <span className="font-normal text-ink-soft">(optional)</span></label>
                <textarea id="bk-notes" className="input" maxLength={500} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Please handle with care. Thank you!" />
              </div>
            </div>
          )}

          {/* Step 3 */}
          {step === 2 && (
            <dl className="mt-6 divide-y divide-line animate-rise">
              {[
                { label: "Your name", value: name, goto: 0 },
                { label: "Phone number", value: phone, goto: 0 },
                { label: "Drop-off location", value: `At the shop (${shop.area})`, goto: 0 },
                { label: "Items", value: itemsLabel, goto: 1 },
                { label: "Preferred collection date", value: date ? formatDate(date, true) : "", goto: 1 },
                { label: "Notes", value: notes || "None", goto: 1 },
              ].map((row) => (
                <div key={row.label} className="flex items-start justify-between gap-4 py-3">
                  <div className="min-w-0">
                    <dt className="text-sm text-ink-soft">{row.label}</dt>
                    <dd className="break-words font-semibold">{row.value}</dd>
                  </div>
                  <button type="button" onClick={() => setStep(row.goto)} className="inline-flex shrink-0 items-center gap-1.5 rounded px-2 py-1 text-sm font-semibold text-primary hover:bg-mint">
                    <Pencil aria-hidden="true" className="h-3.5 w-3.5" />
                    Edit<span className="sr-only"> {row.label}</span>
                  </button>
                </div>
              ))}
            </dl>
          )}

          {submitError && (
            <div role="alert" className="mt-6 flex items-start gap-3 rounded-lg border border-danger/30 bg-[#FDF0EE] p-4 text-sm text-danger">
              <AlertCircle aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0" />
              <p>{submitError}</p>
            </div>
          )}

          <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
            {step > 0 ? (
              <button type="button" className="btn btn-outline" onClick={() => setStep((s) => s - 1)}>Back</button>
            ) : (
              <span />
            )}
            {step < 2 ? (
              <button type="submit" className="btn btn-primary sm:min-w-[160px]">Continue</button>
            ) : (
              <button type="submit" aria-busy={submitting} className="btn btn-primary sm:min-w-[220px]">
                {submitting ? (<><Loader2 aria-hidden="true" className="h-5 w-5 animate-spin" />Sending request</>) : submitError ? "Try again" : "Send booking request"}
              </button>
            )}
          </div>
        </div>

        {/* Summary */}
        <aside aria-label="Order summary" className="card p-5 sm:p-6 lg:sticky lg:top-24">
          <h2 className="text-lg font-bold">Order summary</h2>
          {lines.length === 0 ? (
            <p className="mt-4 rounded-lg bg-canvas p-4 text-sm text-ink-soft">Items you add will appear here.</p>
          ) : (
            <ul className="mt-4 space-y-2">
              {lines.map((l) => (
                <li key={l.service.id} className="flex justify-between gap-3">
                  <span>{l.qty} &times; {l.service.name}</span>
                  <span className="font-semibold tabular-nums">{formatNaira(l.qty * l.service.price)}</span>
                </li>
              ))}
            </ul>
          )}
          <div className="mt-4 flex items-center justify-between border-t border-line pt-4">
            <span className="font-semibold">Estimated total</span>
            <span className="font-display text-2xl font-extrabold tabular-nums">{formatNaira(total)}</span>
          </div>
          <p className="mt-3 text-sm text-ink-soft">Shop confirms final price and collection date. No account needed.</p>
        </aside>
      </form>
    </div>
  );
}
