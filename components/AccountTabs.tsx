"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { href: "/account/orders", label: "My orders" },
  { href: "/account/profile", label: "Profile" },
];

export function AccountTabs() {
  const pathname = usePathname();
  return (
    <div className="border-b border-line bg-white">
      <nav aria-label="Account" className="container-page flex gap-6">
        {tabs.map((t) => {
          const active = pathname.startsWith(t.href);
          return (
            <Link
              key={t.href}
              href={t.href}
              aria-current={active ? "page" : undefined}
              className={`relative py-3.5 text-sm font-semibold transition-colors ${active ? "text-primary" : "text-ink-soft hover:text-ink"}`}
            >
              {t.label}
              <span aria-hidden="true" className={`absolute inset-x-0 bottom-0 h-0.5 origin-left rounded-full bg-primary transition-transform duration-300 ${active ? "scale-x-100" : "scale-x-0"}`} />
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
