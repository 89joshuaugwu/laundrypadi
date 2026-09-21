"use client";

import { Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { navLinks } from "@/lib/site";
import { useAuth } from "./AuthProvider";
import { Logo } from "./Logo";

export function Navbar() {
  const pathname = usePathname();
  const { user, ready, signOut } = useAuth();
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

  const firstName = user?.displayName?.split(" ")[0] || user?.email?.split("@")[0] || "there";

  const AccountActions = ({ mobile = false }: { mobile?: boolean }) => (
    <>
      {ready && user ? (
        <>
          <span className={`text-sm font-semibold text-ink-soft ${mobile ? "px-1" : "hidden lg:inline"}`}>Hi, {firstName}</span>
          <button type="button" onClick={() => signOut()} className={`btn btn-outline btn-sm ${mobile ? "w-full" : ""}`}>
            Sign out
          </button>
        </>
      ) : (
        <Link href="/login" className={`btn btn-outline btn-sm ${mobile ? "w-full" : ""}`}>
          Sign in
        </Link>
      )}
      <Link href="/track" className={`btn btn-primary btn-sm ${mobile ? "w-full" : ""}`}>
        Track my order
      </Link>
    </>
  );

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
                className={`group relative rounded px-3 py-2 text-sm font-medium transition-colors duration-200 ${
                  active ? "text-primary" : "text-ink-soft hover:text-ink"
                }`}
              >
                {link.label}
                <span
                  aria-hidden="true"
                  className={`absolute inset-x-3 -bottom-0.5 h-0.5 origin-left rounded-full bg-primary transition-transform duration-300 ease-out ${
                    active ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"
                  }`}
                />
              </Link>
            );
          })}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <AccountActions />
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
        className={`grid border-t border-line bg-white transition-[grid-template-rows] duration-300 ease-out md:hidden ${
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr] border-transparent"
        }`}
      >
        <div className="overflow-hidden">
          <nav aria-label="Mobile" className="container-page flex flex-col gap-1 py-4" hidden={!open}>
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                aria-current={pathname === link.href ? "page" : undefined}
                className={`rounded px-1 py-3 font-display text-base font-semibold ${
                  pathname === link.href ? "text-primary" : "text-ink"
                }`}
              >
                {link.label}
              </Link>
            ))}
            <div className="mt-3 flex flex-col gap-3">
              <AccountActions mobile />
            </div>
          </nav>
        </div>
      </div>
    </header>
  );
}
