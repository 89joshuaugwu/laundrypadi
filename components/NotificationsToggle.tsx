"use client";

import { Bell, BellOff, Loader2 } from "lucide-react";
import { useNotifications } from "./useNotifications";
import { Alert } from "./ui";

/** "Get notified" toggle for order-status and booking-request updates. Reusable in profile and settings pages. */
export function NotificationsToggle({ label = "Order updates" }: { label?: string }) {
  const { state, busy, error, turnOn, turnOff } = useNotifications();
  if (state === "unsupported") return null;

  return (
    <div className="rounded-lg border border-line bg-white p-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${state === "on" ? "bg-mint text-primary" : "bg-canvas text-ink-soft"}`}>
            {state === "on" ? <Bell aria-hidden="true" className="h-5 w-5" /> : <BellOff aria-hidden="true" className="h-5 w-5" />}
          </span>
          <div>
            <p className="font-semibold">{label}</p>
            <p className="text-sm text-ink-soft">
              {state === "denied" ? "Blocked in your browser settings" : state === "on" ? "Notifications are on for this device" : "Get a notification the moment there's an update"}
            </p>
          </div>
        </div>
        {state === "checking" ? (
          <Loader2 aria-hidden="true" className="h-5 w-5 animate-spin text-ink-soft" />
        ) : state === "denied" ? null : (
          <button type="button" className={state === "on" ? "btn btn-outline btn-sm" : "btn btn-primary btn-sm"} aria-busy={busy} onClick={state === "on" ? turnOff : turnOn}>
            {busy ? <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" /> : state === "on" ? "Turn off" : "Turn on"}
          </button>
        )}
      </div>
      {error && <div className="mt-3"><Alert>{error}</Alert></div>}
    </div>
  );
}
