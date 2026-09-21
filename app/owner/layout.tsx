import type { Metadata } from "next";
import type { ReactNode } from "react";
import { OwnerProvider } from "@/components/owner/OwnerProvider";
import { OwnerShell } from "@/components/owner/OwnerShell";
import { RequireRole } from "@/components/RequireRole";

export const metadata: Metadata = {
  title: { default: "Shop dashboard", template: "%s | LaundryPadi" },
  robots: { index: false, follow: false },
};

export default function OwnerLayout({ children }: { children: ReactNode }) {
  return (
    <RequireRole role="owner">
      <OwnerProvider>
        <OwnerShell>{children}</OwnerShell>
      </OwnerProvider>
    </RequireRole>
  );
}
