"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { getExistingSubscription, pushSupported, subscribeToPush, subscriptionToJson } from "@/lib/push-client";

export type NotifyState = "checking" | "off" | "on" | "denied" | "unsupported";

const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

/** Shared subscribe/unsubscribe logic behind the notifications toggle and the inline banner prompt. */
export function useNotifications() {
  const [state, setState] = useState<NotifyState>("checking");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      if (!publicKey || !pushSupported()) return setState("unsupported");
      if (Notification.permission === "denied") return setState("denied");
      const existing = await getExistingSubscription();
      setState(existing ? "on" : "off");
    })();
  }, []);

  async function turnOn() {
    if (!publicKey) return;
    setBusy(true);
    setError("");
    try {
      const sub = await subscribeToPush(publicKey);
      await apiFetch("/api/push/subscribe", { body: subscriptionToJson(sub) });
      setState("on");
    } catch (e) {
      setError((e as Error).message);
      setState(Notification.permission === "denied" ? "denied" : "off");
    } finally {
      setBusy(false);
    }
  }

  async function turnOff() {
    setBusy(true);
    setError("");
    try {
      const sub = await getExistingSubscription();
      if (sub) {
        await apiFetch("/api/push/subscribe", { method: "DELETE", body: subscriptionToJson(sub) }).catch(() => undefined);
        await sub.unsubscribe();
      }
      setState("off");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return { state, busy, error, turnOn, turnOff };
}
