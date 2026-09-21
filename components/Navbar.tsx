"use client";

import { ChevronDown, LayoutDashboard, LogOut, Menu, PackageSearch, User as UserIcon, X } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { navLinks } from "@/lib/site";
import { useAuth } from "./AuthProvider";
import { Logo } from "./Logo";

function UserMenu({ name, isOwner, onSignOut }: { name: string; isOwner: boolean; onSignOut: () => void }) {
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => !box.current?.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const item = "flex w-full items-center gap-3 rounded px-3 py-2.5 text-left text-sm font-medium hover:bg-mint";
  return (
    <div ref={box} className="relative">
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((v) => !v)}
        className="flex h-10 items-center gap-2 rounded-full border border-line bg-white pl-1 pr-3 transition-colors hover:border-primary"
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary font-display text-sm font-bold text-white">{name.charAt(0).toUpperCase()}</span>
        <span className="hidden max-w-[110px] truncate text-sm font-semibold lg:block">Hi, {name}</span>
        <ChevronDown aria-hidden="true" className={`h-4 w-4 transition-transform duration-300 ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div role="menu" className="absolute right-0 top-12 z-50 w-56 animate-rise rounded-lg border border-line bg-white p-1.5 shadow-card">
          {isOwner ? (
            <Link role="menuitem" href="/owner" className={item} onClick={() => setOpen(false)}><LayoutDashboard aria-hidden="true" className="h-4 w-4" />Dashboard</Link>
          ) : (
            <>
              <Link role="menuitem" href="/account/orders" className={item} onClick={() => setOpen(false)}><PackageSearch aria-hidden="true" className="h-4 w-4" />My orders</Link>
              <Link role="menuitem" href="/account/profile" className={item} onClick={() => setOpen(false)}><UserIcon aria-hidden="true" className="h-4 w-4" />Profile</Link>
            </>
          )}
          <button role="menuitem" type="button" className={item} onClick={onSignOut}><LogOut aria-hidden="true" className="h-4 w-4" />Sign out</button>
        </div>
      )}
    </div>
  );
}

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, profile, ready, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  // The shop dashboard has its own shell.
  if (pathname.startsWith("/owner")) return null;

  const isOwner = profile?.role === "owner";
  const name = (profile?.name || user?.displayName || user?.email?.split("@")[0] || "there").split(" ")[0];
  const handleSignOut = async () => {
    await signOut();
    setOpen(false);
    router.push("/");
  };
  const signedIn = ready && !!user;

  return (
    <header
      className={`sticky top-0 z-50 border-b bg-white/95 backdrop-blur transition-shadow duration-300 ${
        scrolled ? "border-line shadow-[0_6px_20px_-14px_rgba(22,51,46,0.35)]" : "border-transparent"
      }`}
    >
      <div className="container-page flex h-16 items-center justify-between gap-6 md:h-[72px]">
        <Logo priority />

        <nav aria-label="Main" className="hidden items-center gap-1 md:flex">
          {navLinks.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={`group relative rounded px-3 py-2 text-sm font-medium transition-colors duration-200 ${active ? "text-primary" : "text-ink-soft hover:text-ink"}`}
              >
                {link.label}
                <span
                  aria-hidden="true"
                  className={`absolute inset-x-3 -bottom-0.5 h-0.5 origin-left rounded-full bg-primary transition-transform duration-300 ease-out ${active ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"}`}
                />
              </Link>
            );
          })}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          {signedIn ? (
            <UserMenu name={name} isOwner={isOwner} onSignOut={handleSignOut} />
          ) : (
            <Link href="/login" className="btn btn-outline btn-sm">Sign in</Link>
          )}
          <Link href="/track" className="btn btn-primary btn-sm">Track my order</Link>
        </div>

        <button
          type="button"
          className="-mr-2 inline-flex h-11 w-11 items-center justify-center rounded md:hidden"
          aria-expanded={open}
          aria-controls="mobile-menu"
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X aria-hidden="true" className="h-6 w-6" /> : <Menu aria-hidden="true" className="h-6 w-6" />}
        </button>
      </div>

      <div
        id="mobile-menu"
        className={`grid border-t border-line bg-white transition-[grid-template-rows] duration-300 ease-out md:hidden ${open ? "grid-rows-[1fr]" : "grid-rows-[0fr] border-transparent"}`}
      >
        <div className="overflow-hidden">
          <nav aria-label="Mobile" className="container-page flex flex-col gap-1 py-4" hidden={!open}>
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href} aria-current={pathname === link.href ? "page" : undefined} className={`rounded px-1 py-3 font-display text-base font-semibold ${pathname === link.href ? "text-primary" : "text-ink"}`}>
                {link.label}
              </Link>
            ))}
            {signedIn && (
              <>
                <Link href={isOwner ? "/owner" : "/account/orders"} className="rounded px-1 py-3 font-display text-base font-semibold text-ink">
                  {isOwner ? "Dashboard" : "My orders"}
                </Link>
                {!isOwner && <Link href="/account/profile" className="rounded px-1 py-3 font-display text-base font-semibold text-ink">Profile</Link>}
              </>
            )}
            <div className="mt-3 flex flex-col gap-3">
              {signedIn ? (
                <button type="button" onClick={handleSignOut} className="btn btn-outline btn-sm w-full">Sign out ({name})</button>
              ) : (
                <Link href="/login" className="btn btn-outline btn-sm w-full">Sign in</Link>
              )}
              <Link href="/track" className="btn btn-primary btn-sm w-full">Track my order</Link>
            </div>
          </nav>
        </div>
      </div>
    </header>
  );
}
