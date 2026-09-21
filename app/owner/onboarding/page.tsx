"use client";

import { ArrowLeft, ArrowRight, Check, Clock, Loader2, MapPin, Plus, Trash2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ImageUpload } from "@/components/owner/ImageUpload";
import { useOwner } from "@/components/owner/OwnerProvider";
import { Alert, CopyButton } from "@/components/ui";
import { apiFetch } from "@/lib/api";
import { DAYS, TIMES } from "@/lib/hours";
import { UNITS } from "@/lib/models";
import { formatNaira, site } from "@/lib/site";
import { isValidNgPhone } from "@/lib/validate";

interface Line { key: number; name: string; unit: string; price: string }
let seed = 1;
const starter = (): Line[] => [
  { key: seed++, name: "Shirts", unit: "Per item", price: "1000" },
  { key: seed++, name: "Trousers", unit: "Per item", price: "1500" },
  { key: seed++, name: "Duvet", unit: "Per item", price: "4000" },
];

const slugify = (v: string) => v.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40);
const STEPS = ["Shop details", "Services", "Finish"];

export default function OnboardingPage() {
  const router = useRouter();
  const { shop, loading } = useOwner();
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [phone, setPhone] = useState("");
  const [area, setArea] = useState("");
  const [landmark, setLandmark] = useState("");
  const [days, setDays] = useState(DAYS[0]);
  const [open, setOpen] = useState("8:00 AM");
  const [close, setClose] = useState("7:00 PM");
  const [logoUrl, setLogoUrl] = useState("");
  const [coverUrl, setCoverUrl] = useState("");
  const [lines, setLines] = useState<Line[]>(starter);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [created, setCreated] = useState<string | null>(null);

  // Someone who already has a shop belongs in the dashboard (unless they just created it here).
  useEffect(() => {
    if (!loading && shop && !created) router.replace("/owner");
  }, [loading, shop, created, router]);

  const shownSlug = slugTouched ? slug : slugify(name);
  const host = site.url.replace(/^https?:\/\//, "");

  function next() {
    setError("");
    if (step === 0) {
      if (name.trim().length < 2) return setError("Enter your business name.");
      if (!/^[a-z0-9][a-z0-9-]{1,38}[a-z0-9]$/.test(shownSlug)) return setError("Your shop link needs 3 to 40 lowercase letters, numbers or hyphens.");
      if (!isValidNgPhone(phone)) return setError("Enter a valid Nigerian phone number, like 0803 123 4567.");
      if (area.trim().length < 2) return setError("Enter your business address.");
    }
    if (step === 1) {
      if (lines.length === 0) return setError("Add at least one service so customers can book.");
      if (lines.some((l) => !l.name.trim() || l.price === "" || !UNITS.includes(l.unit as (typeof UNITS)[number]))) return setError("Give every service a name and a price.");
    }
    setStep((s) => s + 1);
  }

  async function create() {
    setBusy(true);
    setError("");
    try {
      await apiFetch("/api/owner/shop", {
        body: {
          name, slug: shownSlug, phone, area, landmark, days, hours: `${open} \u2013 ${close}`, logoUrl, coverUrl,
          services: lines.map((l) => ({ name: l.name, unit: l.unit, price: Number(l.price) })),
        },
      });
      setCreated(shownSlug);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  if (created) {
    const link = `${site.url}/s/${created}`;
    return (
      <div className="mx-auto max-w-xl">
        <div className="card animate-rise p-6 text-center sm:p-10">
          <span className="mx-auto flex h-16 w-16 animate-pop items-center justify-center rounded-full bg-primary text-white"><Check aria-hidden="true" className="h-8 w-8" strokeWidth={3} /></span>
          <h1 className="mt-6 text-3xl font-extrabold tracking-tight">Your shop is ready!</h1>
          <p className="mt-2 text-ink-soft">Your public shop link is live. Share it on WhatsApp, Instagram or on a flyer.</p>
          <p className="mt-5 break-all rounded-lg bg-mint px-4 py-3 font-semibold">{link}</p>
          <div className="mt-4 flex flex-wrap justify-center gap-3"><CopyButton text={link} /><a href={`/s/${created}`} target="_blank" rel="noopener noreferrer" className="btn btn-outline btn-sm">View public shop</a></div>
          <Link href="/owner" className="btn btn-primary mt-8 w-full sm:w-auto">Go to dashboard <ArrowRight aria-hidden="true" className="h-5 w-5" /></Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Let&rsquo;s set up your shop</h1>
      <p className="mt-1 text-ink-soft">Add your shop details so customers can find you online.</p>

      <ol aria-label="Setup steps" className="mt-6 flex max-w-xl items-center">
        {STEPS.map((label, i) => (
          <li key={label} aria-current={i === step ? "step" : undefined} className="flex flex-1 items-center last:flex-none">
            <span className="flex items-center gap-2">
              <span className={`flex h-9 w-9 items-center justify-center rounded-full border-2 font-display text-sm font-bold transition-all duration-500 ${i < step ? "border-primary bg-primary text-white" : i === step ? "animate-pulse-ring border-primary bg-white text-primary" : "border-line bg-white text-ink-soft"}`}>{i < step ? <Check aria-hidden="true" className="h-4 w-4" strokeWidth={3} /> : i + 1}</span>
              <span className={`hidden text-sm font-semibold sm:block ${i <= step ? "text-ink" : "text-ink-soft"}`}>{label}</span>
              <span className="sr-only sm:hidden">{label}</span>
            </span>
            {i < STEPS.length - 1 && <span aria-hidden="true" className="mx-3 h-[3px] flex-1 overflow-hidden rounded-full bg-line"><span className="block h-full origin-left bg-primary transition-transform duration-700" style={{ transform: `scaleX(${i < step ? 1 : 0})` }} /></span>}
          </li>
        ))}
      </ol>

      <div className="mt-8 grid items-start gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="card p-5 sm:p-7">
          {step === 0 && (
            <div className="animate-rise space-y-5">
              <div><label htmlFor="ob-name" className="label">Business name</label><input id="ob-name" className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="FreshFold Laundry" /></div>
              <div>
                <label htmlFor="ob-slug" className="label">Public shop link</label>
                <div className="flex items-stretch overflow-hidden rounded border border-line bg-white focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/25">
                  <span className="flex items-center bg-canvas px-3 text-sm text-ink-soft">{host}/s/</span>
                  <input id="ob-slug" className="h-12 min-w-0 flex-1 px-3 text-[15px] outline-none" value={shownSlug} onChange={(e) => { setSlugTouched(true); setSlug(slugify(e.target.value)); }} aria-describedby="ob-slug-hint" />
                </div>
                <p id="ob-slug-hint" className="field-hint">This will be your public shop address. It cannot be changed later.</p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div><label htmlFor="ob-phone" className="label">Phone number</label><input id="ob-phone" className="input" type="tel" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="0803 123 4567" /><p className="field-hint">Customers reach you on WhatsApp with this number.</p></div>
                <div><label htmlFor="ob-area" className="label">Business address</label><input id="ob-area" className="input" value={area} onChange={(e) => setArea(e.target.value)} placeholder="Independence Layout, Enugu" /></div>
              </div>
              <div><label htmlFor="ob-landmark" className="label">Landmark <span className="font-normal text-ink-soft">(optional)</span></label><input id="ob-landmark" className="input" value={landmark} onChange={(e) => setLandmark(e.target.value)} placeholder="Near Independence Layout Market" /></div>
              <div className="grid gap-4 sm:grid-cols-3">
                <div><label htmlFor="ob-days" className="label">Open days</label><select id="ob-days" className="input" value={days} onChange={(e) => setDays(e.target.value)}>{DAYS.map((d) => <option key={d}>{d}</option>)}</select></div>
                <div><label htmlFor="ob-open" className="label">Opens</label><select id="ob-open" className="input" value={open} onChange={(e) => setOpen(e.target.value)}>{TIMES.map((t) => <option key={t}>{t}</option>)}</select></div>
                <div><label htmlFor="ob-close" className="label">Closes</label><select id="ob-close" className="input" value={close} onChange={(e) => setClose(e.target.value)}>{TIMES.map((t) => <option key={t}>{t}</option>)}</select></div>
              </div>
              <div className="grid gap-5 sm:grid-cols-2">
                <ImageUpload label="Shop logo" shape="square" value={logoUrl} onChange={setLogoUrl} hint="Recommended 400 × 400px" />
                <ImageUpload label="Shop photo" value={coverUrl} onChange={setCoverUrl} hint="Shown at the top of your shop page" />
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="animate-rise">
              <h2 className="text-lg font-bold">Services &amp; prices</h2>
              <p className="mt-1 text-ink-soft">These show on your public page and in new orders. You can change them any time.</p>
              <ul className="mt-5 space-y-3">
                {lines.map((l) => (
                  <li key={l.key} className="grid grid-cols-2 items-end gap-3 rounded-lg border border-line p-3 sm:grid-cols-[1.4fr_120px_110px_auto] sm:border-0 sm:p-0">
                    <div className="col-span-2 sm:col-span-1"><label htmlFor={`ln-${l.key}`} className="label sm:sr-only">Service name</label><input id={`ln-${l.key}`} className="input" value={l.name} maxLength={40} onChange={(e) => setLines((ls) => ls.map((x) => (x.key === l.key ? { ...x, name: e.target.value } : x)))} placeholder="Service name" /></div>
                    <div><label htmlFor={`lu-${l.key}`} className="label sm:sr-only">Unit</label><select id={`lu-${l.key}`} className="input" value={l.unit} onChange={(e) => setLines((ls) => ls.map((x) => (x.key === l.key ? { ...x, unit: e.target.value } : x)))}>{UNITS.map((u) => <option key={u}>{u}</option>)}</select></div>
                    <div><label htmlFor={`lp-${l.key}`} className="label sm:sr-only">Price (&#8358;)</label><input id={`lp-${l.key}`} className="input" inputMode="numeric" value={l.price} onChange={(e) => setLines((ls) => ls.map((x) => (x.key === l.key ? { ...x, price: e.target.value.replace(/\D/g, "").slice(0, 8) } : x)))} placeholder="1000" /></div>
                    <button type="button" aria-label={`Remove ${l.name || "service"}`} onClick={() => setLines((ls) => ls.filter((x) => x.key !== l.key))} className="col-span-2 flex h-12 w-full items-center justify-center rounded text-ink-soft hover:text-danger sm:col-span-1 sm:w-10"><Trash2 aria-hidden="true" className="h-4 w-4" /></button>
                  </li>
                ))}
              </ul>
              <button type="button" className="btn btn-outline btn-sm mt-4" onClick={() => setLines((ls) => [...ls, { key: seed++, name: "", unit: "Per item", price: "" }])}><Plus aria-hidden="true" className="h-4 w-4" />Add service</button>
            </div>
          )}

          {step === 2 && (
            <div className="animate-rise">
              <h2 className="text-lg font-bold">Ready to go live?</h2>
              <dl className="mt-4 divide-y divide-line text-sm">
                <div className="flex justify-between gap-4 py-3"><dt className="text-ink-soft">Business</dt><dd className="text-right font-semibold">{name}</dd></div>
                <div className="flex justify-between gap-4 py-3"><dt className="text-ink-soft">Shop link</dt><dd className="break-all text-right font-semibold">{host}/s/{shownSlug}</dd></div>
                <div className="flex justify-between gap-4 py-3"><dt className="text-ink-soft">Phone</dt><dd className="font-semibold">{phone}</dd></div>
                <div className="flex justify-between gap-4 py-3"><dt className="text-ink-soft">Address</dt><dd className="text-right font-semibold">{area}</dd></div>
                <div className="flex justify-between gap-4 py-3"><dt className="text-ink-soft">Hours</dt><dd className="text-right font-semibold">{days}, {open} &ndash; {close}</dd></div>
                <div className="flex justify-between gap-4 py-3"><dt className="text-ink-soft">Services</dt><dd className="text-right font-semibold">{lines.length}</dd></div>
              </dl>
              <p className="mt-4 rounded-lg bg-canvas p-4 text-sm text-ink-soft">Launch pricing is {formatNaira(site.pricing.setup)} one-time setup and {formatNaira(site.pricing.monthly)} a month. You can see your plan under Settings, Subscription.</p>
            </div>
          )}

          {error && <div className="mt-5"><Alert>{error}</Alert></div>}

          <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
            {step > 0 ? <button type="button" className="btn btn-outline" onClick={() => { setError(""); setStep((s) => s - 1); }}><ArrowLeft aria-hidden="true" className="h-4 w-4" />Back</button> : <span />}
            {step < 2 ? (
              <button type="button" className="btn btn-primary sm:min-w-[200px]" onClick={next}>Save and continue <ArrowRight aria-hidden="true" className="h-4 w-4" /></button>
            ) : (
              <button type="button" className="btn btn-primary sm:min-w-[200px]" aria-busy={busy} onClick={create}>{busy ? <><Loader2 aria-hidden="true" className="h-5 w-5 animate-spin" />Creating shop</> : "Create my shop"}</button>
            )}
          </div>
        </div>

        {/* Live preview of the public page */}
        <aside aria-label="Preview of your public shop" className="card overflow-hidden lg:sticky lg:top-24">
          <p className="px-5 pt-4 text-sm font-semibold text-ink-soft">Preview: your public shop</p>
          <div className="relative m-4 mb-0 aspect-[16/10] overflow-hidden rounded-lg bg-mint">
            <Image src={coverUrl || "/images/hero-towels.jpg"} alt="" fill sizes="400px" className="object-cover object-[80%_50%]" />
          </div>
          <div className="space-y-2 p-5">
            <p className="font-display text-xl font-extrabold">{name || "Your shop name"}</p>
            <p className="flex items-center gap-2 text-sm text-ink-soft"><MapPin aria-hidden="true" className="h-4 w-4" />{area || "Your address"}</p>
            <p className="flex items-center gap-2 text-sm text-ink-soft"><Clock aria-hidden="true" className="h-4 w-4" />{days}, {open} &ndash; {close}</p>
            <span aria-hidden="true" className="btn btn-primary mt-2 w-full">Request a booking</span>
          </div>
        </aside>
      </div>
    </div>
  );
}
