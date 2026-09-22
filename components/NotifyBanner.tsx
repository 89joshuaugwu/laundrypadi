"use client";

import { Bell, Loader2, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useNotifications } from "./useNotifications";

/** A one-line, dismissible nudge — shown only while push is off and not yet dismissed on this device. */
export function NotifyBanner({ text, storageKey }: { text: string; storageKey: string }) {
  const { state, busy, turnOn } = useNotifications();
  const [dismissed, setDismissed] = useState(true); // starts hidden; localStorage check below may reveal it

  useEffect(() => {
    setDismissed(window.localStorage.getItem(storageKey) === "1");
  }, [storageKey]);

  function dismiss() {
    window.localStorage.setItem(storageKey, "1");
    setDismissed(true);
  }

  if (state !== "off" || dismissed) return null;

  return (
    <div className="flex animate-rise items-center gap-3 rounded-lg border border-line bg-white p-3.5 sm:p-4">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-mint text-primary"><Bell aria-hidden="true" className="h-4 w-4" /></span>
      <p className="min-w-0 flex-1 text-sm text-ink-soft">{text}</p>
      <button type="button" className="btn btn-primary btn-sm shrink-0" aria-busy={busy} onClick={async () => { await turnOn(); dismiss(); }}>
        {busy ? <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" /> : "Turn on"}
      </button>
      <button type="button" aria-label="Dismiss" onClick={dismiss} className="flex h-8 w-8 shrink-0 items-center justify-center rounded text-ink-soft hover:bg-canvas"><X aria-hidden="true" className="h-4 w-4" /></button>
    </div>
  );
}
