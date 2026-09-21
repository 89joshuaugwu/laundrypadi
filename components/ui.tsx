"use client";

import { AlertCircle, Check, CheckCircle2, Copy, Loader2, X } from "lucide-react";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";

/* ---------- Modal (focus is trapped, Escape closes, focus returns to the trigger) ---------- */
export function Modal({
  open,
  onClose,
  title,
  children,
  wide = false,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  wide?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const titleId = useId();

  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    const node = ref.current;
    node?.focus();
    document.body.style.overflow = "hidden";

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") return onClose();
      if (e.key !== "Tab" || !node) return;
      const f = node.querySelectorAll<HTMLElement>('a[href],button:not([disabled]),input:not([disabled]),select,textarea,[tabindex]:not([tabindex="-1"])');
      if (f.length === 0) return;
      const first = f[0];
      const last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
      previous?.focus();
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center sm:items-center sm:p-4">
      <div className="absolute inset-0 animate-fade bg-ink/45" onClick={onClose} aria-hidden="true" />
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={`relative max-h-[92vh] w-full animate-rise overflow-y-auto rounded-t-lg bg-white p-5 shadow-2xl outline-none sm:rounded-lg sm:p-6 ${wide ? "sm:max-w-xl" : "sm:max-w-md"}`}
      >
        <div className="flex items-start justify-between gap-4">
          <h2 id={titleId} className="text-xl font-bold">{title}</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="-mr-2 -mt-1 flex h-10 w-10 items-center justify-center rounded text-ink-soft hover:bg-canvas hover:text-ink">
            <X aria-hidden="true" className="h-5 w-5" />
          </button>
        </div>
        <div className="mt-4">{children}</div>
      </div>
    </div>
  );
}

/* ---------- Small pieces ---------- */
export function Alert({ tone = "error", children }: { tone?: "error" | "success"; children: ReactNode }) {
  const err = tone === "error";
  return (
    <div role={err ? "alert" : "status"} className={`flex items-start gap-3 rounded-lg border p-3.5 text-sm ${err ? "border-danger/30 bg-[#FDF0EE] text-danger" : "border-primary/25 bg-mint text-ink"}`}>
      {err ? <AlertCircle aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0" /> : <CheckCircle2 aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-primary" />}
      <div>{children}</div>
    </div>
  );
}

export function EmptyState({ icon, title, text, action }: { icon?: ReactNode; title: string; text?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center rounded-lg bg-canvas px-6 py-10 text-center">
      {icon && <span className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-white text-ink-soft">{icon}</span>}
      <p className="font-display text-lg font-bold">{title}</p>
      {text && <p className="mt-1 max-w-sm text-ink-soft">{text}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function StatCard({ icon, label, value, tone = "mint" }: { icon: ReactNode; label: string; value: ReactNode; tone?: "mint" | "blue" | "red" }) {
  const bg = tone === "mint" ? "bg-mint text-primary" : tone === "blue" ? "bg-[#E4EDF9] text-[#1F4B8A]" : "bg-[#FBE5E1] text-[#8F2417]";
  return (
    <div className="card flex items-center gap-4 p-4 sm:p-5">
      <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-lg ${bg}`}>{icon}</span>
      <div className="min-w-0">
        <p className="font-display text-2xl font-extrabold leading-none tabular-nums sm:text-3xl">{value}</p>
        <p className="mt-1.5 text-sm text-ink-soft">{label}</p>
      </div>
    </div>
  );
}

export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative h-7 w-12 shrink-0 rounded-full transition-colors duration-300 ${checked ? "bg-primary" : "bg-[#C5CFCB]"}`}
    >
      <span className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-all duration-300 ${checked ? "left-[22px]" : "left-0.5"}`} />
    </button>
  );
}

export function CopyButton({ text, label = "Copy link", className = "" }: { text: string; label?: string; className?: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      className={`btn btn-outline btn-sm ${className}`}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setDone(true);
          setTimeout(() => setDone(false), 1800);
        } catch {
          window.prompt("Copy this link", text);
        }
      }}
    >
      {done ? <Check aria-hidden="true" className="h-4 w-4 text-primary" /> : <Copy aria-hidden="true" className="h-4 w-4" />}
      <span aria-live="polite">{done ? "Copied" : label}</span>
    </button>
  );
}

export function Spinner({ className = "h-5 w-5" }: { className?: string }) {
  return <Loader2 aria-hidden="true" className={`animate-spin ${className}`} />;
}

export function PillTabs<T extends string>({
  items,
  value,
  onChange,
  label,
}: {
  items: { id: T; label: string; count?: number }[];
  value: T;
  onChange: (v: T) => void;
  label: string;
}) {
  return (
    <div role="tablist" aria-label={label} className="flex max-w-full gap-1 overflow-x-auto rounded border border-line bg-canvas p-1">
      {items.map((t) => (
        <button
          key={t.id}
          role="tab"
          type="button"
          aria-selected={value === t.id}
          onClick={() => onChange(t.id)}
          className={`whitespace-nowrap rounded px-3.5 py-2 text-sm font-semibold transition-colors duration-200 ${value === t.id ? "bg-white text-primary-dark shadow-sm" : "text-ink-soft hover:text-ink"}`}
        >
          {t.label}
          {t.count !== undefined && t.count > 0 && (
            <span className={`ml-1.5 rounded-full px-1.5 py-0.5 text-xs ${value === t.id ? "bg-mint" : "bg-line"}`}>{t.count}</span>
          )}
        </button>
      ))}
    </div>
  );
}

export function PageSkeleton() {
  return (
    <div className="space-y-5" aria-label="Loading">
      <div className="skeleton h-9 w-64" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="skeleton h-24" />
        <div className="skeleton h-24" />
        <div className="skeleton h-24" />
      </div>
      <div className="skeleton h-72 w-full" />
    </div>
  );
}
