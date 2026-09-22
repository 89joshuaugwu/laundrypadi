"use client";

import { ArrowRight, Inbox, Package, Plus, Shirt, Wallet } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import { NotifyBanner } from "@/components/NotifyBanner";
import { OrderTable } from "@/components/owner/OrderTable";
import { useOwner } from "@/components/owner/OwnerProvider";
import { EmptyState, StatCard } from "@/components/ui";
import { BILLING_ENFORCED, billingOk } from "@/lib/billing-shared";
import { balanceOf } from "@/lib/models";
import { formatNaira, greeting, todayLagos } from "@/lib/site";

export default function OverviewPage() {
  const { user, profile } = useAuth();
  const { shop, orders, pending } = useOwner();
  const today = todayLagos();
  const name = (profile?.name || user?.displayName || "there").split(" ")[0];

  const active = orders.filter((o) => o.status === "received" || o.status === "washing").length;
  const ready = orders.filter((o) => o.status === "ready").length;
  const outstanding = orders.reduce((sum, o) => sum + balanceOf(o), 0);
  const work = orders
    .filter((o) => o.status !== "collected")
    .sort((a, b) => (a.collectionDate || "9999").localeCompare(b.collectionDate || "9999"))
    .slice(0, 8);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">{greeting()}, {name}</h1>
          <p className="mt-1 text-ink-soft">Here&rsquo;s what&rsquo;s happening at {shop?.name} today.</p>
        </div>
        <Link href="/owner/orders/new" className="btn btn-primary"><Plus aria-hidden="true" className="h-5 w-5" />New order</Link>
      </div>

      <NotifyBanner storageKey="lp-notify-dismissed-owner" text="Get notified the moment a new booking request comes in." />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard icon={<Package aria-hidden="true" className="h-6 w-6" />} label="Active orders" value={active} tone="blue" />
        <StatCard icon={<Shirt aria-hidden="true" className="h-6 w-6" />} label="Ready for collection" value={ready} />
        <StatCard icon={<Wallet aria-hidden="true" className="h-6 w-6" />} label="Outstanding balance" value={formatNaira(outstanding)} tone={outstanding > 0 ? "red" : "mint"} />
      </div>

      <section className="card overflow-hidden">
        <div className="flex items-center justify-between gap-3 p-5 pb-3">
          <h2 className="text-lg font-bold">Today&rsquo;s work</h2>
          <Link href="/owner/orders" className="group inline-flex items-center gap-1.5 text-sm font-semibold text-primary">
            View all orders <ArrowRight aria-hidden="true" className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
          </Link>
        </div>
        {work.length === 0 ? (
          <div className="p-5 pt-2">
            <EmptyState
              icon={<Package aria-hidden="true" className="h-7 w-7" />}
              title="No orders in progress"
              text="Create your first order when a customer drops off their laundry."
              action={<Link href="/owner/orders/new" className="btn btn-primary btn-sm">New order</Link>}
            />
          </div>
        ) : (
          <OrderTable orders={work} today={today} />
        )}
      </section>

      {pending.length > 0 ? (
        <div className="flex flex-col gap-4 rounded-lg bg-mint p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-white text-primary"><Inbox aria-hidden="true" className="h-6 w-6" /></span>
            <div>
              <p className="font-display text-lg font-bold">{pending.length} booking {pending.length === 1 ? "request" : "requests"}</p>
              <p className="text-ink-soft">New customer requests waiting for your review.</p>
            </div>
          </div>
          <Link href="/owner/orders?tab=requests" className="btn btn-primary">Review requests</Link>
        </div>
      ) : (
        shop && (
          <p className="text-sm text-ink-soft">
            No booking requests waiting. Your public page is at{" "}
            <Link href={`/s/${shop.slug}`} target="_blank" className="font-semibold text-primary underline underline-offset-4">/s/{shop.slug}</Link>.
          </p>
        )
      )}
    </div>
  );
}
