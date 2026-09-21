"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { useAuth } from "./AuthProvider";
import { PageSkeleton } from "./ui";

/**
 * Client-side gate for account and dashboard areas. It only decides what to show:
 * the real protection is Firestore rules plus token checks in the API routes.
 */
export function RequireRole({ role, children }: { role: "customer" | "owner"; children: ReactNode }) {
  const { user, profile, ready } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (ready && !user) router.replace(`/login?next=${encodeURIComponent(pathname)}`);
  }, [ready, user, router, pathname]);

  if (!ready || !user) {
    return (
      <div className="container-page py-10">
        <PageSkeleton />
      </div>
    );
  }

  // A missing profile is treated as a customer account (owners must have chosen "Shop owner" at sign-up).
  const actual = profile?.role ?? "customer";
  if (actual !== role) {
    return (
      <div className="container-page py-16 text-center">
        <h1 className="text-3xl font-extrabold tracking-tight">
          {role === "owner" ? "This area is for shop owners" : "This area is for customers"}
        </h1>
        <p className="mx-auto mt-3 max-w-md text-lg text-ink-soft">
          {role === "owner"
            ? "You are signed in with a customer account. To run a shop, sign in with a shop owner account."
            : "You are signed in with a shop owner account. Your orders and customers are in the dashboard."}
        </p>
        <Link href={role === "owner" ? "/account/orders" : "/owner"} className="btn btn-primary mt-8">
          {role === "owner" ? "Go to my orders" : "Go to my dashboard"}
        </Link>
      </div>
    );
  }
  return <>{children}</>;
}
