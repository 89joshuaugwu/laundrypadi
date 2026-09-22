"use client";

import { Bell, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";

export interface ToastInput {
  title: string;
  body: string;
  href?: string;
}

interface Toast extends ToastInput {
  id: number;
}

interface ToastState {
  toast: (t: ToastInput) => void;
}

const ToastContext = createContext<ToastState>({ toast: () => {} });
export const useToast = () => useContext(ToastContext);

let seed = 1;
const LIFESPAN = 6000;

/**
 * A lightweight "you're already here" notification, for the moment a live update arrives while
 * someone is on the site — separate from (and a complement to) web push, which covers the case
 * where they've closed the tab. If the tab is in the background when one arrives, the browser
 * tab title picks up an unread count so it's noticed on switching back.
 */
export function ToastProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [unread, setUnread] = useState(0);
  const baseTitle = useRef("");

  useEffect(() => {
    baseTitle.current = document.title;
    const onVisible = () => {
      if (!document.hidden) {
        setUnread(0);
        document.title = baseTitle.current;
      }
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, []);

  useEffect(() => {
    document.title = unread > 0 ? `(${unread}) ${baseTitle.current}` : baseTitle.current;
  }, [unread]);

  const dismiss = useCallback((id: number) => setToasts((t) => t.filter((x) => x.id !== id)), []);

  const toast = useCallback(
    (input: ToastInput) => {
      const id = seed++;
      setToasts((t) => [...t.slice(-3), { ...input, id }]); // keep at most 4 on screen at once
      if (document.hidden) setUnread((n) => n + 1);
      window.setTimeout(() => dismiss(id), LIFESPAN);
    },
    [dismiss],
  );

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div aria-live="polite" className="pointer-events-none fixed inset-x-4 bottom-4 z-[80] flex flex-col gap-2.5 sm:inset-x-auto sm:right-5 sm:w-[360px]">
        {toasts.map((t) => (
          <div key={t.id} role="status" className="pointer-events-auto animate-rise overflow-hidden rounded-lg border border-line bg-white shadow-card">
            <div className="flex items-start gap-3 p-4">
              <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-mint text-primary"><Bell aria-hidden="true" className="h-4 w-4" /></span>
              <button
                type="button"
                onClick={() => {
                  dismiss(t.id);
                  if (t.href) router.push(t.href);
                }}
                className="min-w-0 flex-1 text-left"
              >
                <p className="font-semibold">{t.title}</p>
                <p className="mt-0.5 text-sm text-ink-soft">{t.body}</p>
              </button>
              <button type="button" aria-label="Dismiss" onClick={() => dismiss(t.id)} className="flex h-7 w-7 shrink-0 items-center justify-center rounded text-ink-soft hover:bg-canvas">
                <X aria-hidden="true" className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
