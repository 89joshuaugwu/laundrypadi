"use client";

import { sendPasswordResetEmail } from "firebase/auth";
import { CheckCircle2, Download, HelpCircle, KeyRound, Loader2, LogOut } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { useAuth } from "@/components/AuthProvider";
import { ImageUpload } from "@/components/owner/ImageUpload";
import { useOwner } from "@/components/owner/OwnerProvider";
import { Alert, CopyButton, PillTabs, Toggle } from "@/components/ui";
import { apiFetch } from "@/lib/api";
import { getFirebaseAuth } from "@/lib/firebase";
import { DAYS, splitHours, TIMES } from "@/lib/hours";
import { formatNaira, prettyPhone, site } from "@/lib/site";

type Tab = "profile" | "account" | "subscription";

export default function SettingsPage() {
  const { shop, orders, customers } = useOwner();
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("profile");

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [area, setArea] = useState("");
  const [landmark, setLandmark] = useState("");
  const [days, setDays] = useState(DAYS[0]);
  const [open, setOpen] = useState("8:00 AM");
  const [close, setClose] = useState("7:00 PM");
  const [logoUrl, setLogoUrl] = useState("");
  const [coverUrl, setCoverUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState("");
  const [toggling, setToggling] = useState(false);
  const [pwMsg, setPwMsg] = useState("");

  const shopId = shop?.id;
  useEffect(() => {
    if (!shop) return;
    setName(shop.name);
    setPhone(prettyPhone(shop.phone));
    setArea(shop.area);
    setLandmark(shop.landmark);
    setDays(shop.days);
    [setOpen, setClose].forEach((set, i) => set(splitHours(shop.hours)[i]));
    setLogoUrl(shop.logoUrl);
    setCoverUrl(shop.coverUrl);
    // Only reset the form when a different shop loads, not on every live update.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shopId]);

  if (!shop) return null;
  const link = `${site.url}/s/${shop.slug}`;
  const dayOptions = DAYS.includes(days) ? DAYS : [days, ...DAYS];

  async function onSave(ev: FormEvent) {
    ev.preventDefault();
    setError("");
    setDone("");
    setBusy(true);
    try {
      await apiFetch("/api/owner/shop", { method: "PATCH", body: { name, phone, area, landmark, days, hours: `${open} \u2013 ${close}`, logoUrl, coverUrl } });
      setDone("Your shop profile is saved.");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function setAccepting(v: boolean) {
    setToggling(true);
    setError("");
    try {
      await apiFetch("/api/owner/shop", { method: "PATCH", body: { accepting: v } });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setToggling(false);
    }
  }

  async function resetPassword() {
    const auth = getFirebaseAuth();
    if (!auth || !user?.email) return;
    try {
      await sendPasswordResetEmail(auth, user.email);
      setPwMsg(`We sent a link to ${user.email}. Open it to choose a new password.`);
    } catch {
      setPwMsg("We could not send the email. Please try again in a moment.");
    }
  }

  function exportData() {
    const payload = { exportedAt: new Date().toISOString(), shop: { name: shop!.name, slug: shop!.slug, services: shop!.services }, customers, orders };
    const url = URL.createObjectURL(new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `${shop!.slug}-shop-data.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Settings</h1>
      <PillTabs label="Settings sections" value={tab} onChange={setTab} items={[{ id: "profile", label: "Shop profile" }, { id: "account", label: "Account" }, { id: "subscription", label: "Subscription" }]} />

      {tab === "profile" && (
        <div className="grid items-start gap-6 lg:grid-cols-[1.5fr_1fr]">
          <form onSubmit={onSave} noValidate className="card space-y-5 p-5 sm:p-7">
            <h2 className="text-lg font-bold">Shop profile</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div><label htmlFor="st-name" className="label">Business name</label><input id="st-name" className="input" value={name} onChange={(e) => setName(e.target.value)} /></div>
              <div><label htmlFor="st-phone" className="label">Phone number</label><input id="st-phone" className="input" type="tel" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} /></div>
            </div>
            <div><label htmlFor="st-area" className="label">Business address</label><input id="st-area" className="input" value={area} onChange={(e) => setArea(e.target.value)} /></div>
            <div><label htmlFor="st-landmark" className="label">Landmark <span className="font-normal text-ink-soft">(optional)</span></label><input id="st-landmark" className="input" value={landmark} onChange={(e) => setLandmark(e.target.value)} placeholder="Near Independence Layout Market" /></div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div><label htmlFor="st-days" className="label">Open days</label><select id="st-days" className="input" value={days} onChange={(e) => setDays(e.target.value)}>{dayOptions.map((d) => <option key={d}>{d}</option>)}</select></div>
              <div><label htmlFor="st-open" className="label">Opens</label><select id="st-open" className="input" value={open} onChange={(e) => setOpen(e.target.value)}>{TIMES.map((t) => <option key={t}>{t}</option>)}</select></div>
              <div><label htmlFor="st-close" className="label">Closes</label><select id="st-close" className="input" value={close} onChange={(e) => setClose(e.target.value)}>{TIMES.map((t) => <option key={t}>{t}</option>)}</select></div>
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <ImageUpload label="Shop logo" shape="square" value={logoUrl} onChange={setLogoUrl} hint="Recommended 400 × 400px" />
              <ImageUpload label="Shop photo" value={coverUrl} onChange={setCoverUrl} hint="Shown at the top of your shop page" />
            </div>
            {error && <Alert>{error}</Alert>}
            {done && <Alert tone="success">{done}</Alert>}
            <button type="submit" className="btn btn-primary" aria-busy={busy}>{busy ? <><Loader2 aria-hidden="true" className="h-5 w-5 animate-spin" />Saving</> : "Save changes"}</button>
          </form>

          <div className="space-y-6">
            <section className="card space-y-3 p-5 sm:p-6">
              <div className="flex items-center justify-between gap-4">
                <div><h2 className="text-lg font-bold">Accepting requests</h2><p className="text-sm text-ink-soft">{shop.accepting ? "Customers can send booking requests." : "Your page shows that you are not taking requests."}</p></div>
                {toggling ? <Loader2 aria-hidden="true" className="h-6 w-6 animate-spin text-primary" /> : <Toggle label="Accepting booking requests" checked={shop.accepting} onChange={setAccepting} />}
              </div>
            </section>
            <section className="card space-y-3 p-5 sm:p-6">
              <h2 className="text-lg font-bold">Public shop link</h2>
              <p className="break-all rounded bg-canvas p-3 text-sm font-semibold">{link}</p>
              <div className="flex flex-wrap gap-2"><CopyButton text={link} /><a href={`/s/${shop.slug}`} target="_blank" rel="noopener noreferrer" className="btn btn-outline btn-sm">View page</a></div>
              <p className="text-xs text-ink-soft">Your link cannot be changed after setup, so it stays safe on flyers and WhatsApp statuses.</p>
            </section>
          </div>
        </div>
      )}

      {tab === "account" && (
        <div className="grid items-start gap-6 lg:grid-cols-2">
          <section className="card overflow-hidden">
            <h2 className="p-5 pb-3 text-lg font-bold sm:px-6">Account</h2>
            <p className="px-5 pb-4 text-sm text-ink-soft sm:px-6">Signed in as <span className="font-semibold text-ink">{user?.email}</span></p>
            <ul className="divide-y divide-line border-t border-line">
              <li><button type="button" onClick={resetPassword} className="flex w-full items-center gap-3 px-5 py-4 text-left hover:bg-canvas sm:px-6"><KeyRound aria-hidden="true" className="h-5 w-5 text-ink-soft" /><span className="font-semibold">Change password</span></button></li>
              <li><button type="button" onClick={async () => { await signOut(); router.push("/"); }} className="flex w-full items-center gap-3 px-5 py-4 text-left hover:bg-canvas sm:px-6"><LogOut aria-hidden="true" className="h-5 w-5 text-danger" /><span className="font-semibold">Sign out</span></button></li>
            </ul>
            {pwMsg && <div className="border-t border-line p-4"><Alert tone="success">{pwMsg}</Alert></div>}
          </section>
          <section className="card overflow-hidden">
            <h2 className="p-5 pb-3 text-lg font-bold sm:px-6">Data &amp; support</h2>
            <ul className="divide-y divide-line border-t border-line">
              <li><button type="button" onClick={exportData} className="flex w-full items-center gap-3 px-5 py-4 text-left hover:bg-canvas sm:px-6"><Download aria-hidden="true" className="h-5 w-5 text-ink-soft" /><span><span className="block font-semibold">Export shop data</span><span className="text-sm text-ink-soft">A copy of your orders, customers and services</span></span></button></li>
              <li><Link href="/help" className="flex items-center gap-3 px-5 py-4 hover:bg-canvas sm:px-6"><HelpCircle aria-hidden="true" className="h-5 w-5 text-ink-soft" /><span className="font-semibold">Get help with your shop</span></Link></li>
            </ul>
          </section>
        </div>
      )}

      {tab === "subscription" && (
        <section className="card max-w-xl space-y-4 p-5 sm:p-7">
          <h2 className="text-lg font-bold">Subscription</h2>
          <div className="rounded-lg bg-mint p-4">
            <p className="text-sm text-ink-soft">Launch plan</p>
            <p className="font-display text-3xl font-extrabold tabular-nums">{formatNaira(shop.subscription.monthly)} <span className="text-base font-bold">/ month</span></p>
          </div>
          <dl className="divide-y divide-line text-sm">
            <div className="flex items-center justify-between py-3"><dt className="text-ink-soft">One-time setup fee</dt><dd className="flex items-center gap-2 font-semibold tabular-nums">{formatNaira(shop.subscription.setupFee)}{shop.subscription.setupPaid ? <span className="inline-flex items-center gap-1 rounded-full bg-[#D6F0DE] px-2.5 py-1 text-xs text-[#0A5F34]"><CheckCircle2 aria-hidden="true" className="h-3.5 w-3.5" />Paid</span> : <span className="rounded-full bg-citrus/50 px-2.5 py-1 text-xs">Not yet paid</span>}</dd></div>
            {shop.subscription.nextInvoice && <div className="flex justify-between py-3"><dt className="text-ink-soft">Next invoice</dt><dd className="font-semibold">{shop.subscription.nextInvoice}</dd></div>}
          </dl>
          <p className="text-sm text-ink-soft">Billing is handled by LaundryPadi. To pay your setup fee or ask about your plan, reach us from the Help page.</p>
        </section>
      )}
    </div>
  );
}
