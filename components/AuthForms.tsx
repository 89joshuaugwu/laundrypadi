"use client";

import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  updateProfile,
} from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { AlertCircle, Eye, EyeOff, Info, Loader2, Store, User as UserIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useId, useRef, useState, type FormEvent } from "react";
import { getDb, getFirebaseAuth, isFirebaseConfigured } from "@/lib/firebase";
import { postAuthPath } from "@/lib/site";
import { useAuth } from "./AuthProvider";
import { Alert, Modal } from "./ui";

type Role = "customer" | "owner";
type View = "login" | "register";

/** Only same-site paths are allowed as a post-login destination, and only ones that fit the role. */
function destination(role: Role, next?: string): string {
  const ok = next && next.startsWith("/") && !next.startsWith("//");
  if (ok && next.startsWith("/owner") && role !== "owner") return postAuthPath[role];
  if (ok && next.startsWith("/account") && role !== "customer") return postAuthPath[role];
  return ok ? (next as string) : postAuthPath[role];
}

function friendlyError(err: unknown): string {
  const code = (err as { code?: string })?.code ?? "";
  switch (code) {
    case "auth/invalid-credential":
    case "auth/wrong-password":
    case "auth/user-not-found":
    case "auth/invalid-email":
      return "The email or password is incorrect.";
    case "auth/email-already-in-use":
      return "An account with this email already exists. Try signing in instead.";
    case "auth/weak-password":
      return "Choose a password with at least 8 characters.";
    case "auth/too-many-requests":
      return "Too many attempts. Wait a few minutes, or reset your password.";
    case "auth/network-request-failed":
      return "We could not reach the server. Check your connection and try again.";
    case "auth/popup-blocked":
      return "Your browser blocked the Google window. Allow pop-ups for this site and try again.";
    case "auth/account-exists-with-different-credential":
      return "This email already has an account that uses a password. Sign in with your email and password.";
    case "auth/unauthorized-domain":
      return "Google sign-in is not enabled for this website address yet.";
    case "auth/operation-not-allowed":
      return "Google sign-in is not switched on yet.";
    default:
      return "Something went wrong. Please try again.";
  }
}

const isCancel = (err: unknown) => {
  const c = (err as { code?: string })?.code;
  return c === "auth/popup-closed-by-user" || c === "auth/cancelled-popup-request";
};

function GoogleLogo() {
  return (
    <svg aria-hidden="true" viewBox="0 0 48 48" className="h-5 w-5">
      <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.9 6.1C12.4 13.6 17.7 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3-2.3 5.5-4.8 7.2l7.5 5.8c4.4-4.1 7.1-10.1 7.1-17.5z" />
      <path fill="#FBBC05" d="M10.5 28.7A14.5 14.5 0 0 1 9.5 24c0-1.6.3-3.2.8-4.7l-7.9-6.1A24 24 0 0 0 0 24c0 3.9.9 7.5 2.6 10.8l7.9-6.1z" />
      <path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.5-5.8c-2.1 1.4-4.9 2.3-8.4 2.3-6.3 0-11.6-4.1-13.5-9.8l-7.9 6.1C6.5 42.6 14.6 48 24 48z" />
    </svg>
  );
}

function GoogleButton({ label, loading, onClick }: { label: string; loading: boolean; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} aria-busy={loading} className="btn btn-outline w-full gap-3">
      {loading ? <Loader2 aria-hidden="true" className="h-5 w-5 animate-spin" /> : <GoogleLogo />}
      {label}
    </button>
  );
}

function OrDivider() {
  return (
    <div className="flex items-center gap-3 text-sm text-ink-soft" role="separator" aria-label="or">
      <span className="h-px flex-1 bg-line" />or<span className="h-px flex-1 bg-line" />
    </div>
  );
}

function PasswordField({
  id, label, value, onChange, autoComplete, error, hint, onForgot,
}: {
  id: string; label: string; value: string; onChange: (v: string) => void; autoComplete: string;
  error?: string; hint?: string; onForgot?: () => void;
}) {
  const [show, setShow] = useState(false);
  return (
    <div>
      <div className="flex items-center justify-between">
        <label htmlFor={id} className="label">{label}</label>
        {onForgot && (
          <button type="button" onClick={onForgot} className="mb-1.5 rounded text-sm font-semibold text-primary underline-offset-4 hover:underline">Forgot password?</button>
        )}
      </div>
      <div className="relative">
        <input id={id} className="input pr-20" type={show ? "text" : "password"} autoComplete={autoComplete} value={value} onChange={(e) => onChange(e.target.value)} aria-invalid={!!error} aria-describedby={error ? `${id}-err` : hint ? `${id}-hint` : undefined} />
        <button type="button" onClick={() => setShow((s) => !s)} aria-pressed={show} aria-label={show ? "Hide password" : "Show password"} className="absolute right-2 top-1/2 flex h-9 -translate-y-1/2 items-center gap-1.5 rounded px-2 text-sm font-semibold text-ink-soft hover:text-primary">
          {show ? <EyeOff aria-hidden="true" className="h-4 w-4" /> : <Eye aria-hidden="true" className="h-4 w-4" />}
          <span aria-hidden="true">{show ? "Hide" : "Show"}</span>
        </button>
      </div>
      {error ? (
        <p id={`${id}-err`} role="alert" className="field-error"><AlertCircle aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />{error}</p>
      ) : hint ? (
        <p id={`${id}-hint`} className="field-hint">{hint}</p>
      ) : null}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Shared Google flow                                                  */
/* ------------------------------------------------------------------ */
function useGoogle(onDone: (role: Role) => void) {
  const { refreshProfile } = useAuth();
  const pending = useRef<{ uid: string; name: string; email: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [chooseRole, setChooseRole] = useState(false);

  async function createProfile(uid: string, name: string, email: string, role: Role) {
    const db = getDb();
    if (!db) return;
    await setDoc(doc(db, "users", uid), { name: name.slice(0, 80), email, role, createdAt: serverTimestamp() });
    await refreshProfile();
  }

  /** `intent` is the account type the person already picked (register view). Without it, new people are asked. */
  async function start(intent: Role | null) {
    setError("");
    const auth = getFirebaseAuth();
    const db = getDb();
    if (!auth || !db) return setError("Sign-in is not set up yet. Add your Firebase keys to .env.local and restart.");
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: "select_account" });
      const { user } = await signInWithPopup(auth, provider);
      const snap = await getDoc(doc(db, "users", user.uid));
      if (snap.exists()) {
        await refreshProfile();
        return onDone(snap.data().role === "owner" ? "owner" : "customer");
      }
      const name = user.displayName || user.email?.split("@")[0] || "Customer";
      const email = user.email ?? "";
      if (intent) {
        await createProfile(user.uid, name, email, intent);
        return onDone(intent);
      }
      pending.current = { uid: user.uid, name, email };
      setChooseRole(true);
    } catch (e) {
      if (!isCancel(e)) setError(friendlyError(e));
    } finally {
      setLoading(false);
    }
  }

  async function finish(role: Role) {
    const p = pending.current;
    if (!p) return;
    setLoading(true);
    try {
      await createProfile(p.uid, p.name, p.email, role);
      setChooseRole(false);
      onDone(role);
    } catch {
      setError("We could not finish setting up your account. Please try again.");
      setChooseRole(false);
    } finally {
      setLoading(false);
    }
  }

  return { start, finish, loading, error, chooseRole, setChooseRole };
}

/* ------------------------------------------------------------------ */
/* Sign in                                                             */
/* ------------------------------------------------------------------ */
function LoginPanel({ onSwitch, primary, next }: { onSwitch: () => void; primary: boolean; next?: string }) {
  const H = primary ? "h1" : "h2";
  const uid = useId();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [formError, setFormError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);

  const go = (role: Role) => {
    router.push(destination(role, next));
    router.refresh();
  };
  const google = useGoogle(go);

  async function onSubmit(ev: FormEvent) {
    ev.preventDefault();
    setFormError("");
    setNotice("");
    const e: typeof errors = {};
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) e.email = "Enter a valid email address.";
    if (!password) e.password = "Enter your password.";
    setErrors(e);
    if (Object.keys(e).length) return;

    const auth = getFirebaseAuth();
    if (!auth) return setFormError("Sign-in is not set up yet. Add your Firebase keys to .env.local and restart.");

    setLoading(true);
    try {
      const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
      const db = getDb();
      const snap = db ? await getDoc(doc(db, "users", cred.user.uid)) : null;
      go(snap?.data()?.role === "owner" ? "owner" : "customer");
    } catch (err) {
      setFormError(friendlyError(err));
      setLoading(false);
    }
  }

  async function onForgot() {
    setFormError("");
    setNotice("");
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) return setErrors({ email: "Enter your email above, then choose Forgot password." });
    const auth = getFirebaseAuth();
    if (!auth) return setFormError("Password reset is not set up yet.");
    try {
      await sendPasswordResetEmail(auth, email.trim());
    } catch (err) {
      if ((err as { code?: string }).code !== "auth/user-not-found") return setFormError(friendlyError(err));
    }
    setNotice("If an account exists for that email, a reset link is on its way.");
  }

  return (
    <section aria-labelledby={`${uid}-h`}>
      <H id={`${uid}-h`} className="text-2xl font-extrabold tracking-tight sm:text-3xl">Welcome back</H>
      <p className="mt-1 text-ink-soft">Sign in to your LaundryPadi account</p>

      <div className="mt-6 space-y-5">
        <GoogleButton label="Continue with Google" loading={google.loading} onClick={() => google.start(null)} />
        {google.error && <Alert>{google.error}</Alert>}
        <OrDivider />
      </div>

      <form onSubmit={onSubmit} noValidate className="mt-5 space-y-5">
        <div>
          <label htmlFor={`${uid}-email`} className="label">Email address</label>
          <input id={`${uid}-email`} className="input" type="email" autoComplete="email" inputMode="email" value={email} onChange={(e) => setEmail(e.target.value)} aria-invalid={!!errors.email} aria-describedby={errors.email ? `${uid}-email-err` : undefined} placeholder="ada@example.com" />
          {errors.email && <p id={`${uid}-email-err`} role="alert" className="field-error"><AlertCircle aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />{errors.email}</p>}
        </div>
        <PasswordField id={`${uid}-pw`} label="Password" value={password} onChange={setPassword} autoComplete="current-password" error={errors.password} onForgot={onForgot} />
        {formError && <Alert>{formError}</Alert>}
        {notice && <Alert tone="success">{notice}</Alert>}
        <button type="submit" aria-busy={loading} className="btn btn-primary w-full">
          {loading ? (<><Loader2 aria-hidden="true" className="h-5 w-5 animate-spin" />Signing in</>) : "Sign in"}
        </button>
      </form>

      <p className="mt-5 text-center text-sm text-ink-soft">
        Don&rsquo;t have an account?{" "}
        <button type="button" onClick={onSwitch} className="font-semibold text-primary underline underline-offset-4">Create account</button>
      </p>

      <Modal open={google.chooseRole} onClose={() => google.setChooseRole(false)} title="One last step">
        <p className="text-ink-soft">You are new here. How will you use LaundryPadi?</p>
        <div className="mt-5 grid gap-3">
          <button type="button" onClick={() => google.finish("customer")} className="flex items-start gap-3 rounded-lg border border-line p-4 text-left transition hover:border-primary hover:bg-mint/50">
            <UserIcon aria-hidden="true" className="mt-0.5 h-5 w-5 text-primary" />
            <span><span className="block font-semibold">Customer</span><span className="text-sm text-ink-soft">Book and track your laundry</span></span>
          </button>
          <button type="button" onClick={() => google.finish("owner")} className="flex items-start gap-3 rounded-lg border border-line p-4 text-left transition hover:border-primary hover:bg-mint/50">
            <Store aria-hidden="true" className="mt-0.5 h-5 w-5 text-primary" />
            <span><span className="block font-semibold">Shop owner</span><span className="text-sm text-ink-soft">Manage your laundry business</span></span>
          </button>
        </div>
      </Modal>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Register                                                            */
/* ------------------------------------------------------------------ */
function RegisterPanel({ initialRole, onSwitch, primary, next }: { initialRole: Role; onSwitch: () => void; primary: boolean; next?: string }) {
  const H = primary ? "h1" : "h2";
  const uid = useId();
  const router = useRouter();
  const { refreshProfile } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>(initialRole);
  const [errors, setErrors] = useState<{ name?: string; email?: string; password?: string }>({});
  const [formError, setFormError] = useState("");
  const [loading, setLoading] = useState(false);

  const go = (r: Role) => {
    router.push(destination(r, next));
    router.refresh();
  };
  const google = useGoogle(go);

  async function onSubmit(ev: FormEvent) {
    ev.preventDefault();
    setFormError("");
    const e: typeof errors = {};
    if (name.trim().length < 2) e.name = "Enter your full name.";
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) e.email = "Enter a valid email address.";
    if (password.length < 8) e.password = "Use at least 8 characters.";
    setErrors(e);
    if (Object.keys(e).length) return;

    const auth = getFirebaseAuth();
    if (!auth) return setFormError("Sign-up is not set up yet. Add your Firebase keys to .env.local and restart.");

    setLoading(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
      const cleanName = name.trim().slice(0, 80);
      await updateProfile(cred.user, { displayName: cleanName });
      const db = getDb();
      if (db) {
        // Fails if the Firestore rules are not published yet; the account still exists.
        await setDoc(doc(db, "users", cred.user.uid), { name: cleanName, email: cred.user.email, role, createdAt: serverTimestamp() }).catch(() => undefined);
      }
      await refreshProfile();
      go(role);
    } catch (err) {
      setFormError(friendlyError(err));
      setLoading(false);
    }
  }

  return (
    <section aria-labelledby={`${uid}-h`}>
      <H id={`${uid}-h`} className="text-2xl font-extrabold tracking-tight sm:text-3xl">Create an account</H>
      <p className="mt-1 text-ink-soft">Join LaundryPadi today</p>

      <fieldset className="mt-6">
        <legend className="label">I am a</legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {([
            { value: "customer", title: "Customer", text: "Book and track your laundry", Icon: UserIcon },
            { value: "owner", title: "Shop owner", text: "Manage your laundry business", Icon: Store },
          ] as { value: Role; title: string; text: string; Icon: typeof UserIcon }[]).map((opt) => (
            <label
              key={opt.value}
              className={`flex cursor-pointer items-start gap-3 rounded border p-3 transition-colors duration-200 has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-primary ${role === opt.value ? "border-primary bg-mint/60" : "border-line hover:border-primary/50"}`}
            >
              <input type="radio" name={`${uid}-role`} value={opt.value} checked={role === opt.value} onChange={() => setRole(opt.value)} className="mt-1 h-4 w-4 accent-[#087F6D]" />
              <span>
                <span className="block font-semibold">{opt.title}</span>
                <span className="text-sm text-ink-soft">{opt.text}</span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="mt-5 space-y-5">
        <GoogleButton label="Sign up with Google" loading={google.loading} onClick={() => google.start(role)} />
        {google.error && <Alert>{google.error}</Alert>}
        <OrDivider />
      </div>

      <form onSubmit={onSubmit} noValidate className="mt-5 space-y-5">
        <div>
          <label htmlFor={`${uid}-name`} className="label">Full name</label>
          <input id={`${uid}-name`} className="input" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} aria-invalid={!!errors.name} aria-describedby={errors.name ? `${uid}-name-err` : undefined} placeholder="Ada Okafor" />
          {errors.name && <p id={`${uid}-name-err`} role="alert" className="field-error"><AlertCircle aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />{errors.name}</p>}
        </div>
        <div>
          <label htmlFor={`${uid}-email`} className="label">Email address</label>
          <input id={`${uid}-email`} className="input" type="email" autoComplete="email" inputMode="email" value={email} onChange={(e) => setEmail(e.target.value)} aria-invalid={!!errors.email} aria-describedby={errors.email ? `${uid}-email-err` : undefined} placeholder="ada@example.com" />
          {errors.email && <p id={`${uid}-email-err`} role="alert" className="field-error"><AlertCircle aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />{errors.email}</p>}
        </div>
        <PasswordField id={`${uid}-pw`} label="Password" value={password} onChange={setPassword} autoComplete="new-password" error={errors.password} hint="At least 8 characters." />
        {formError && <Alert>{formError}</Alert>}
        <button type="submit" aria-busy={loading} className="btn btn-primary w-full">
          {loading ? (<><Loader2 aria-hidden="true" className="h-5 w-5 animate-spin" />Creating account</>) : "Create account"}
        </button>
      </form>

      <p className="mt-5 text-center text-sm text-ink-soft">
        Already have an account?{" "}
        <button type="button" onClick={onSwitch} className="font-semibold text-primary underline underline-offset-4">Sign in</button>
      </p>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Screen: one card at a time, sliding between the two                 */
/* ------------------------------------------------------------------ */
export function AuthForms({ initial, initialRole = "customer", next }: { initial: View; initialRole?: Role; next?: string }) {
  const [view, setView] = useState<View>(initial);
  const [leaving, setLeaving] = useState(false);
  const [dir, setDir] = useState<"forward" | "back">("forward");
  const { user } = useAuth();

  function switchTo(target: View) {
    if (target === view || leaving) return;
    setDir(target === "register" ? "forward" : "back");
    setLeaving(true);
    setTimeout(() => {
      setView(target);
      setLeaving(false);
      // Keep the address bar in step without a page reload.
      const qs = window.location.search;
      window.history.replaceState(null, "", `${target === "login" ? "/login" : "/register"}${qs}`);
    }, 180);
  }

  const panelAnim = leaving
    ? dir === "forward" ? "animate-out-left" : "animate-out-right"
    : dir === "forward" ? "animate-in-right" : "animate-in-left";

  return (
    <div className="container-page py-8 sm:py-12">
      <div className="mx-auto max-w-md">
        {!isFirebaseConfigured && (
          <div className="mb-5 flex items-start gap-3 rounded-lg border border-line bg-white p-4 text-sm text-ink-soft">
            <Info aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
            <p>Accounts are not connected yet. Add your Firebase keys to <code className="rounded bg-canvas px-1.5 py-0.5 font-mono text-[13px]">.env.local</code> and restart the server.</p>
          </div>
        )}
        {user && <div className="mb-5 rounded-lg bg-mint p-4 text-sm" role="status">You&rsquo;re already signed in as <span className="font-semibold">{user.email}</span>.</div>}

        {/* Sliding switch */}
        <div role="tablist" aria-label="Account" className="relative mb-5 grid grid-cols-2 rounded-lg border border-line bg-white p-1">
          <span
            aria-hidden="true"
            className="absolute inset-y-1 left-1 w-[calc(50%-4px)] rounded bg-primary shadow-sm transition-transform duration-300 ease-out"
            style={{ transform: view === "login" ? "translateX(0)" : "translateX(100%)" }}
          />
          {([["login", "Sign in"], ["register", "Create account"]] as [View, string][]).map(([v, label]) => (
            <button key={v} type="button" role="tab" aria-selected={view === v} onClick={() => switchTo(v)} className={`relative z-10 rounded py-2.5 text-sm font-semibold transition-colors duration-300 ${view === v ? "text-white" : "text-ink-soft hover:text-ink"}`}>
              {label}
            </button>
          ))}
        </div>

        <div className="card overflow-hidden p-5 sm:p-8">
          <div key={view} className={panelAnim}>
            {view === "login" ? (
              <LoginPanel primary next={next} onSwitch={() => switchTo("register")} />
            ) : (
              <RegisterPanel primary next={next} initialRole={initialRole} onSwitch={() => switchTo("login")} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
