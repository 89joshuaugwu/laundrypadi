import type { Metadata } from "next";
import type { ReactNode } from "react";
import { AccountTabs } from "@/components/AccountTabs";
import { RequireRole } from "@/components/RequireRole";

export const metadata: Metadata = {
  title: { default: "My account", template: "%s | LaundryPadi" },
  robots: { index: false, follow: false },
};

export default function AccountLayout({ children }: { children: ReactNode }) {
  return (
    <RequireRole role="customer">
      <div className="bg-canvas">
        <AccountTabs />
        <div className="container-page py-8 sm:py-12">{children}</div>
      </div>
    </RequireRole>
  );
}
