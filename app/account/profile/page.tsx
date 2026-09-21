"use client";

import { sendPasswordResetEmail, updateProfile } from "firebase/auth";
import { doc, updateDoc } from "firebase/firestore";
import { ChevronRight, Eye, EyeOff, HelpCircle, KeyRound, Loader2, LogOut } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { useAuth } from "@/components/AuthProvider";
import { Alert } from "@/components/ui";
import { getDb, getFirebaseAuth } from "@/lib/firebase";
import { prettyPhone } from "@/lib/site";
import { isValidNgPhone, normalizePhone } from "@/lib/validate";

export default function ProfilePage() {
  const { user, profile, refreshProfile, signOut } = useAuth();
  const router = useRouter();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [reveal, setReveal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState("");
  const [pwMsg, setPwMsg] = useState("");

  useEffect(() => {
    setName(profile?.name || user?.displayName || "");
    setPhone(profile?.phone ? prettyPhone(profile.phone) : "");
  }, [profile, user]);

  // The phone number is masked until the person chooses to reveal it.
  const masked = phone && !reveal ? `\u2022\u2022\u2022 \u2022\u2022\u2022 ${normalizePhone(phone).slice(-4)}` : phone;

  async function onSave(ev: FormEvent) {
    ev.preventDefault();
    setError("");
    setDone("");
    if (name.trim().length < 2) return setError("Enter your name.");
    if (phone && !isValidNgPhone(phone)) return setError("Enter a valid Nigerian phone number, like 0803 123 4567.");
    const db = getDb();
    const auth = getFirebaseAuth();
    if (!db || !auth?.currentUser) return setError("Please sign in again.");

    setSaving(true);
    try {
      const update: Record<string, string> = { name: name.trim().slice(0, 80) };
      if (phone) update.phone = normalizePhone(phone);
      await updateDoc(doc(db, "users", auth.currentUser.uid), update);
      await updateProfile(auth.currentUser, { displayName: update.name });
      await refreshProfile();
      setDone("Your changes are saved.");
    } catch {
      setError("We could not save your changes. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  async function onChangePassword() {
    setPwMsg("");
    const auth = getFirebaseAuth();
    if (!auth || !user?.email) return;
    try {
      await sendPasswordResetEmail(auth, user.email);
      setPwMsg(`We sent a link to ${user.email}. Open it to choose a new password.`);
    } catch {
      setPwMsg("We could not send the email. Please try again in a moment.");
    }
  }

  const row = "flex w-full items-center gap-3 px-4 py-4 text-left transition-colors hover:bg-canvas";

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="animate-rise text-3xl font-extrabold tracking-tight sm:text-4xl">Profile</h1>

      <form onSubmit={onSave} noValidate className="card mt-6 animate-rise space-y-5 p-5 sm:p-7" style={{ animationDelay: "80ms" }}>
        <h2 className="text-lg font-bold">Personal information</h2>
        <div>
          <label htmlFor="pf-name" className="label">Name</label>
          <input id="pf-name" className="input" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div>
          <label htmlFor="pf-email" className="label">Email address</label>
          <input id="pf-email" className="input bg-canvas" value={user?.email ?? ""} readOnly aria-describedby="pf-email-hint" />
          <p id="pf-email-hint" className="field-hint">Your email is your sign-in and can not be changed here.</p>
        </div>
        <div>
          <label htmlFor="pf-phone" className="label">Phone number</label>
          <div className="relative">
            <input
              id="pf-phone"
              className="input pr-24"
              type={reveal ? "tel" : "text"}
              inputMode="tel"
              autoComplete="tel"
              value={masked}
              readOnly={!reveal && !!phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="0803 123 4567"
            />
            {phone && (
              <button type="button" onClick={() => setReveal((v) => !v)} aria-pressed={reveal} className="absolute right-2 top-1/2 flex h-9 -translate-y-1/2 items-center gap-1.5 rounded px-2 text-sm font-semibold text-ink-soft hover:text-primary">
                {reveal ? <EyeOff aria-hidden="true" className="h-4 w-4" /> : <Eye aria-hidden="true" className="h-4 w-4" />}
                {reveal ? "Hide" : "Edit"}
              </button>
            )}
          </div>
          <p className="field-hint">Shops use this number to reach you about your orders.</p>
        </div>

        {error && <Alert>{error}</Alert>}
        {done && <Alert tone="success">{done}</Alert>}

        <button type="submit" aria-busy={saving} className="btn btn-primary">
          {saving ? (<><Loader2 aria-hidden="true" className="h-5 w-5 animate-spin" />Saving</>) : "Save changes"}
        </button>
      </form>

      <section className="card mt-6 animate-rise overflow-hidden" style={{ animationDelay: "160ms" }}>
        <h2 className="px-5 pt-5 text-lg font-bold sm:px-7">Account settings</h2>
        <ul className="mt-3 divide-y divide-line border-t border-line">
          <li><button type="button" onClick={onChangePassword} className={row}><KeyRound aria-hidden="true" className="h-5 w-5 text-ink-soft" /><span className="flex-1 font-semibold">Change password</span><ChevronRight aria-hidden="true" className="h-4 w-4 text-ink-soft" /></button></li>
          <li><button type="button" onClick={async () => { await signOut(); router.push("/"); }} className={row}><LogOut aria-hidden="true" className="h-5 w-5 text-danger" /><span className="flex-1 font-semibold">Sign out</span><ChevronRight aria-hidden="true" className="h-4 w-4 text-ink-soft" /></button></li>
          <li><Link href="/help" className={row}><HelpCircle aria-hidden="true" className="h-5 w-5 text-ink-soft" /><span className="flex-1 font-semibold">Get help and support</span><ChevronRight aria-hidden="true" className="h-4 w-4 text-ink-soft" /></Link></li>
        </ul>
        {pwMsg && <div className="border-t border-line p-4"><Alert tone="success">{pwMsg}</Alert></div>}
      </section>
    </div>
  );
}
