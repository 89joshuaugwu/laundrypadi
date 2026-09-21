"use client";

import { Bell, ClipboardList, Globe, HelpCircle, LayoutDashboard, Menu, BarChart3, Settings, Tags, Users, X } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { useAuth } from "../AuthProvider";
import { Logo } from "../Logo";
import { Alert, PageSkeleton } from "../ui";
import { useOwner } from "./OwnerProvider";

const nav = [
  { href: "/owner", label: "Overview", Icon: LayoutDashboard, exact: true },
  { href: "/owner/orders", label: "Orders", Icon: ClipboardList },
  { href: "/owner/customers", label: "Customers", Icon: Users },
  { href: "/owner/services", label: "Services", Icon: Tags },
  { href: "/owner/reports", label: "Reports", Icon: BarChart3 },
  { href: "/owner/settings", label: "Settings", Icon: Settings },
];

export function OwnerShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, profile, signOut } = useAuth();
  const { loading, error, shop, pending } = useOwner();
  const [open, setOpen] = useState(false);
  const onboarding = pathname === "/owner/onboarding";

  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    if (!loading && !error && !shop && !onboarding) router.replace("/owner/onboarding");
  }, [loading, error, shop, onboarding, router]);

  const name = (profile?.name || user?.displayName || "Owner").split(" ")[0];

  if (onboarding) {
    return (
      <div className="min-h-screen bg-canvas">
        <header className="border-b border-line bg-white">
          <div className="container-page flex h-16 items-center justify-between">
            <Logo />
            <button type="button" className="btn btn-outline btn-sm" onClick={async () => { await signOut(); router.push("/"); }}>Sign out</button>
          </div>
        </header>
        <div className="container-page py-8 sm:py-12">{error ? <Alert>{error}</Alert> : children}</div>
      </div>
    );
  }

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="hidden px-5 pb-2 pt-5 lg:block"><Logo /></div>
      <div className="mx-4 mt-4 rounded-lg bg-mint px-3 py-2.5 lg:mt-2">
        <p className="truncate font-display text-sm font-bold">{shop?.name ?? "Your shop"}</p>
        <p className="text-xs text-ink-soft">Shop owner</p>
      </div>
      <nav aria-label="Dashboard" className="mt-4 flex-1 space-y-1 px-3">
        {nav.map(({ href, label, Icon, exact }) => {
          const active = exact ? pathname === href : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={`flex items-center gap-3 rounded px-3 py-2.5 text-[15px] font-semibold transition-colors duration-200 ${active ? "bg-mint text-primary-dark" : "text-ink-soft hover:bg-canvas hover:text-ink"}`}
            >
              <Icon aria-hidden="true" className="h-5 w-5" />
              {label}
              {label === "Orders" && pending.length > 0 && (
                <span className="ml-auto rounded-full bg-primary px-2 py-0.5 text-xs font-bold text-white">{pending.length}</span>
              )}
            </Link>
          );
        })}
      </nav>
      <div className="space-y-1 border-t border-line p-3">
        {shop && (
          <a href={`/s/${shop.slug}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 rounded px-3 py-2.5 text-[15px] font-semibold text-ink-soft hover:bg-canvas hover:text-ink">
            <Globe aria-hidden="true" className="h-5 w-5" />View public shop
          </a>
        )}
        <Link href="/help" className="flex items-center gap-3 rounded px-3 py-2.5 text-[15px] font-semibold text-ink-soft hover:bg-canvas hover:text-ink">
          <HelpCircle aria-hidden="true" className="h-5 w-5" />Help
        </Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-canvas lg:pl-64">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r border-line bg-white lg:block">{sidebar}</aside>

      {/* Mobile drawer */}
      {open && <div className="fixed inset-0 z-40 animate-fade bg-ink/40 lg:hidden" onClick={() => setOpen(false)} aria-hidden="true" />}
      <aside
        id="owner-drawer"
        aria-hidden={!open}
        className={`fixed inset-y-0 left-0 z-50 w-72 border-r border-line bg-white pt-16 transition-transform duration-300 ease-out lg:hidden ${open ? "translate-x-0" : "-translate-x-full"}`}
        {...(!open ? { inert: "" as unknown as boolean } : {})}
      >
        {sidebar}
      </aside>

      <header className="sticky top-0 z-30 border-b border-line bg-white/95 backdrop-blur">
        <div className="flex h-16 items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 lg:hidden">
            <button type="button" aria-expanded={open} aria-controls="owner-drawer" aria-label={open ? "Close menu" : "Open menu"} onClick={() => setOpen((v) => !v)} className="-ml-2 flex h-11 w-11 items-center justify-center rounded">
              {open ? <X aria-hidden="true" className="h-6 w-6" /> : <Menu aria-hidden="true" className="h-6 w-6" />}
            </button>
            <Logo />
          </div>
          <div className="hidden lg:block" />
          <div className="flex items-center gap-3">
            <Link href="/owner/orders?tab=requests" aria-label={pending.length ? `${pending.length} booking requests waiting` : "Booking requests"} className="relative flex h-10 w-10 items-center justify-center rounded-full border border-line bg-white text-ink-soft transition-colors hover:border-primary hover:text-primary">
              <Bell aria-hidden="true" className="h-5 w-5" />
              {pending.length > 0 && <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[11px] font-bold text-white">{pending.length}</span>}
            </Link>
            <Link href="/owner/settings" className="flex items-center gap-2.5 rounded-full border border-line bg-white py-1 pl-1 pr-4 transition-colors hover:border-primary">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary font-display text-sm font-bold text-white">{name.charAt(0).toUpperCase()}</span>
              <span className="hidden text-left leading-tight sm:block">
                <span className="block text-sm font-semibold">{name}</span>
                <span className="block max-w-[140px] truncate text-xs text-ink-soft">{shop?.name}</span>
              </span>
            </Link>
          </div>
        </div>
      </header>

      <main id="owner-main" className="px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <div className="mx-auto max-w-6xl">
          {error ? <Alert>{error}</Alert> : loading || !shop ? <PageSkeleton /> : <div key={pathname} className="animate-rise">{children}</div>}
        </div>
      </main>
    </div>
  );
}
