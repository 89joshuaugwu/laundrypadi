"use client";

import { CreditCard, LayoutDashboard, Loader2, LogOut, ShieldAlert, Store, Users } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { useAuth } from "../AuthProvider";
import { Logo } from "../Logo";
import { apiFetch } from "@/lib/api";
import { Alert } from "../ui";

const nav = [
  { href: "/admin", label: "Overview", Icon: LayoutDashboard, exact: true },
  { href: "/admin/shops", label: "Shops", Icon: Store },
  { href: "/admin/users", label: "Users", Icon: Users },
  { href: "/admin/payments", label: "Payments", Icon: CreditCard },
];

/**
 * Gates the whole /admin area behind the server-side email allowlist (see lib/server.ts
 * authAdmin). There is no client-visible "is this user an admin" flag anywhere — we just ask
 * the server, once, and render nothing sensitive until it says yes.
 */
export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, ready, signOut } = useAuth();
  const [state, setState] = useState<"checking" | "ok" | "denied">("checking");

  useEffect(() => {
    if (!ready) return;
    if (!user) {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
      return;
    }
    let cancelled = false;
    apiFetch("/api/admin/check", { method: "GET" })
      .then(() => !cancelled && setState("ok"))
      .catch(() => !cancelled && setState("denied"));
    return () => {
      cancelled = true;
    };
  }, [ready, user, pathname, router]);

  if (!ready || !user || state === "checking") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ink">
        <Loader2 aria-hidden="true" className="h-8 w-8 animate-spin text-white/70" />
      </div>
    );
  }

  if (state === "denied") {
    return (
      <div className="container-page flex min-h-screen flex-col items-center justify-center text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[#FBE5E1] text-[#8F2417]"><ShieldAlert aria-hidden="true" className="h-7 w-7" /></span>
        <h1 className="mt-5 text-2xl font-extrabold tracking-tight">You do not have access to this area</h1>
        <p className="mt-2 max-w-sm text-ink-soft">Signed in as {user.email}. If this should be an admin account, add its email to ADMIN_EMAILS.</p>
        <Link href="/" className="btn btn-primary mt-7">Go to home</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-canvas lg:pl-64">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col bg-ink text-white lg:flex">
        <div className="px-5 pb-2 pt-5">
          <Logo className="brightness-0 invert" />
          <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 text-xs font-semibold text-white/80"><ShieldAlert aria-hidden="true" className="h-3.5 w-3.5" />Admin area</p>
        </div>
        <nav aria-label="Admin" className="mt-4 flex-1 space-y-1 px-3">
          {nav.map(({ href, label, Icon, exact }) => {
            const active = exact ? pathname === href : pathname.startsWith(href);
            return (
              <Link key={href} href={href} aria-current={active ? "page" : undefined} className={`flex items-center gap-3 rounded px-3 py-2.5 text-[15px] font-semibold transition-colors duration-200 ${active ? "bg-white/15 text-white" : "text-white/70 hover:bg-white/10 hover:text-white"}`}>
                <Icon aria-hidden="true" className="h-5 w-5" />{label}
              </Link>
            );
          })}
        </nav>
        <div className="space-y-1 border-t border-white/10 p-3">
          <button type="button" onClick={async () => { await signOut(); router.push("/"); }} className="flex w-full items-center gap-3 rounded px-3 py-2.5 text-[15px] font-semibold text-white/70 hover:bg-white/10 hover:text-white">
            <LogOut aria-hidden="true" className="h-5 w-5" />Sign out
          </button>
        </div>
      </aside>

      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-line bg-white/95 px-4 backdrop-blur sm:px-6 lg:hidden">
        <Logo />
        <span className="rounded-full bg-[#FBE5E1] px-2.5 py-1 text-xs font-semibold text-[#8F2417]">Admin</span>
      </header>

      <main className="px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <div className="mx-auto max-w-6xl">{children}</div>
      </main>
    </div>
  );
}

export function AdminError({ message }: { message: string }) {
  return <Alert>{message}</Alert>;
}
