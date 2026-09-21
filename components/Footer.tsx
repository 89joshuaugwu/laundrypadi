"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "./Logo";
import { site } from "@/lib/site";

export function Footer() {
  const pathname = usePathname();
  if (pathname.startsWith("/owner")) return null; // the dashboard has its own shell
  return (
    <footer className="border-t border-line bg-white">
      <div className="container-page flex flex-col gap-6 py-8 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap items-center gap-x-8 gap-y-4">
          <Logo />
          <nav aria-label="Footer" className="flex items-center gap-6 text-sm text-ink-soft">
            <Link href="/help" className="transition-colors hover:text-primary">Help</Link>
            <Link href="/privacy" className="transition-colors hover:text-primary">Privacy</Link>
            <Link href="/terms" className="transition-colors hover:text-primary">Terms</Link>
          </nav>
        </div>
        <div className="text-sm text-ink-soft md:text-right">
          <p>{site.tagline}</p>
          <p className="mt-1">&copy; 2026 LaundryPadi</p>
        </div>
      </div>
    </footer>
  );
}
