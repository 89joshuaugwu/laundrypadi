"use client";

import {
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { AlertCircle, CheckCircle2, Eye, EyeOff, Info, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useId, useState, type FormEvent, type ReactNode } from "react";
import { getDb, getFirebaseAuth, isFirebaseConfigured } from "@/lib/firebase";
import { postAuthPath } from "@/lib/site";
import { useAuth } from "./AuthProvider";

type Role = "customer" | "owner";
type View = "login" | "register";

const roleLabel: Record<Role, string> = { customer: "customer", owner: "shop owner" };

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
    default:
      return "Something went wrong. Please try again.";
  }
}

function PasswordField({
  id,
  label,
  value,
  onChange,
  autoComplete,
  error,
  hint,
  onForgot,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  autoComplete: string;
  error?: string;
  hint?: string;
  onForgot?: () => void;
}) {
  const [show, setShow] = useState(false);
  return (
    <div>
      <div className="flex items-center justify-between">
        <label htmlFor={id} className="label">{label}</label>
        {onForgot && (
          <button type="button" onClick={onForgot} className="mb-1.5 rounded text-sm font-semibold text-primary underline-offset-4 hover:underline">
            Forgot password?
          </button>
        )}
      </div>
      <div className="relative">
        <input
          id={id}
          className="input pr-16"
          type={show ? "text" : "password"}
          autoComplete={autoComplete}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-err` : hint ? `${id}-hint` : undefined}
        />
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          aria-pressed={show}
          aria-label={show ? "Hide password" : "Show password"}
          className="absolute right-2 top-1/2 flex h-9 -translate-y-1/2 items-center gap-1 rounded px-2 text-sm font-semibold text-ink-soft hover:text-primary"
        >
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

function FormAlert({ tone, children }: { tone: "error" | "info"; children: ReactNode }) {
  const isError = tone === "error";
  return (
    <div
      role={isError ? "alert" : "status"}
      className={`flex items-start gap-3 rounded-lg border p-4 text-sm ${
        isError ? "border-danger/30 bg-[#FDF0EE] text-danger" : "border-primary/25 bg-mint text-ink"
      }`}
    >
      {isError ? <AlertCircle aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0" /> : <CheckCircle2 aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-primary" />}
      <p>{children}</p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Sign in                                                             */
/* ------------------------------------------------------------------ */
function LoginCard({ onSwitch, primary }: { onSwitch: () => void; primary: boolean }) {
  const H = primary ? "h1" : "h2";
  const uid = useId();
  const router = useRouter();
  const [role, setRole] = useState<Role>("customer");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [formError, setFormError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);

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
      let saved: Role | null = null;
      if (db) {
        const snap = await getDoc(doc(db, "users", cred.user.uid));
        const r = snap.exists() ? snap.data().role : null;
        if (r === "customer" || r === "owner") saved = r;
      }
      if (saved && saved !== role) {
        await signOut(auth);
        const other = roleLabel[saved];
        setFormError(`This email belongs to a ${other} account. Choose the ${saved === "owner" ? "Shop owner" : "Customer"} tab and try again.`);
        return;
      }
      router.push(postAuthPath[saved ?? role]);
      router.refresh();
    } catch (err) {
      setFormError(friendlyError(err));
    } finally {
      setLoading(false);
    }
  }

  async function onForgot() {
    setFormError("");
    setNotice("");
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
      setErrors({ email: "Enter your email above, then choose Forgot password." });
      return;
    }
    const auth = getFirebaseAuth();
    if (!auth) return setFormError("Password reset is not set up yet.");
    try {
      await sendPasswordResetEmail(auth, email.trim());
    } catch (err) {
      const code = (err as { code?: string }).code;
      if (code !== "auth/user-not-found") return setFormError(friendlyError(err));
    }
    setNotice("If an account exists for that email, a reset link is on its way.");
  }

  return (
    <section aria-labelledby={`${uid}-h`} className="card p-5 sm:p-7">
      <H id={`${uid}-h`} className="text-2xl font-extrabold tracking-tight">Welcome back</H>
      <p className="mt-1 text-ink-soft">Sign in to your LaundryPadi account</p>

      <div role="radiogroup" aria-label="Account type" className="mt-6 grid grid-cols-2 rounded border border-line bg-canvas p-1">
        {(["customer", "owner"] as Role[]).map((r) => (
          <button
            key={r}
            type="button"
            role="radio"
            aria-checked={role === r}
            onClick={() => setRole(r)}
            className={`rounded py-2 text-sm font-semibold transition-all duration-300 ${role === r ? "bg-primary text-white shadow-sm" : "text-ink-soft hover:text-ink"}`}
          >
            {r === "customer" ? "Customer" : "Shop owner"}
          </button>
        ))}
      </div>

      <form onSubmit={onSubmit} noValidate className="mt-5 space-y-5">
        <div>
          <label htmlFor={`${uid}-email`} className="label">Email address</label>
          <input id={`${uid}-email`} className="input" type="email" autoComplete="email" inputMode="email" value={email} onChange={(e) => setEmail(e.target.value)} aria-invalid={!!errors.email} aria-describedby={errors.email ? `${uid}-email-err` : undefined} placeholder="ada@example.com" />
          {errors.email && <p id={`${uid}-email-err`} role="alert" className="field-error"><AlertCircle aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />{errors.email}</p>}
        </div>
        <PasswordField id={`${uid}-pw`} label="Password" value={password} onChange={setPassword} autoComplete="current-password" error={errors.password} onForgot={onForgot} />

        {formError && <FormAlert tone="error">{formError}</FormAlert>}
        {notice && <FormAlert tone="info">{notice}</FormAlert>}

        <button type="submit" aria-busy={loading} className="btn btn-primary w-full">
          {loading ? (<><Loader2 aria-hidden="true" className="h-5 w-5 animate-spin" />Signing in</>) : "Sign in"}
        </button>
      </form>

      <p className="mt-5 text-center text-sm text-ink-soft">
        Don&rsquo;t have an account?{" "}
        <button type="button" onClick={onSwitch} className="font-semibold text-primary underline underline-offset-4 lg:hidden">Create account</button>
        <a href="#register" className="hidden font-semibold text-primary underline underline-offset-4 lg:inline">Create account</a>
      </p>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Register                                                            */
/* ------------------------------------------------------------------ */
function RegisterCard({ initialRole, onSwitch, primary }: { initialRole: Role; onSwitch: () => void; primary: boolean }) {
  const H = primary ? "h1" : "h2";
  const uid = useId();
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>(initialRole);
  const [errors, setErrors] = useState<{ name?: string; email?: string; password?: string }>({});
  const [formError, setFormError] = useState("");
  const [loading, setLoading] = useState(false);

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
        await setDoc(doc(db, "users", cred.user.uid), {
          name: cleanName,
          email: cred.user.email,
          role,
          createdAt: serverTimestamp(),
        }).catch(() => undefined);
      }
      router.push(postAuthPath[role]);
      router.refresh();
    } catch (err) {
      setFormError(friendlyError(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <section id="register" aria-labelledby={`${uid}-h`} className="card scroll-mt-28 p-5 sm:p-7">
      <H id={`${uid}-h`} className="text-2xl font-extrabold tracking-tight">Create an account</H>
      <p className="mt-1 text-ink-soft">Join LaundryPadi today</p>

      <form onSubmit={onSubmit} noValidate className="mt-6 space-y-5">
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

        <fieldset>
          <legend className="label">Account type</legend>
          <div className="space-y-2">
            {([
              { value: "customer", title: "Customer", text: "Book and track your laundry" },
              { value: "owner", title: "Shop owner", text: "Manage your laundry business" },
            ] as { value: Role; title: string; text: string }[]).map((opt) => (
              <label
                key={opt.value}
                className={`flex cursor-pointer items-start gap-3 rounded border p-3 transition-colors duration-200 has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-primary ${
                  role === opt.value ? "border-primary bg-mint/60" : "border-line hover:border-primary/50"
                }`}
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

        {formError && <FormAlert tone="error">{formError}</FormAlert>}

        <button type="submit" aria-busy={loading} className="btn btn-primary w-full">
          {loading ? (<><Loader2 aria-hidden="true" className="h-5 w-5 animate-spin" />Creating account</>) : "Create account"}
        </button>
      </form>

      <p className="mt-5 text-center text-sm text-ink-soft lg:hidden">
        Already have an account?{" "}
        <button type="button" onClick={onSwitch} className="font-semibold text-primary underline underline-offset-4">Sign in</button>
      </p>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Screen: both cards side by side on desktop, one at a time on phones */
/* ------------------------------------------------------------------ */
export function AuthForms({ initial, initialRole = "customer" }: { initial: View; initialRole?: Role }) {
  const [view, setView] = useState<View>(initial);
  const { user } = useAuth();

  return (
    <div className="container-page py-8 sm:py-12">
      {!isFirebaseConfigured && (
        <div className="mx-auto mb-6 flex max-w-5xl items-start gap-3 rounded-lg border border-line bg-white p-4 text-sm text-ink-soft">
          <Info aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
          <p>Accounts are not connected yet. Add your Firebase keys to <code className="rounded bg-canvas px-1.5 py-0.5 font-mono text-[13px]">.env.local</code> (see <code className="rounded bg-canvas px-1.5 py-0.5 font-mono text-[13px]">.env.example</code>) and restart the server.</p>
        </div>
      )}
      {user && (
        <div className="mx-auto mb-6 max-w-5xl rounded-lg bg-mint p-4 text-sm" role="status">
          You&rsquo;re already signed in as <span className="font-semibold">{user.email}</span>.
        </div>
      )}

      <div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-2">
        <div className={`${view === "login" ? "block" : "hidden"} animate-rise lg:block`}>
          <LoginCard primary={initial === "login"} onSwitch={() => setView("register")} />
        </div>
        <div className={`${view === "register" ? "block" : "hidden"} animate-rise lg:block`} style={{ animationDelay: "80ms" }}>
          <RegisterCard primary={initial === "register"} initialRole={initialRole} onSwitch={() => setView("login")} />
        </div>
      </div>
    </div>
  );
}
