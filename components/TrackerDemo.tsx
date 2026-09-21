"use client";

import { useEffect, useState } from "react";
import { ORDER_STEPS } from "@/lib/types";
import { ProgressTracker } from "./ProgressTracker";
import { StatusChip } from "./StatusChip";

const messages = [
  "The shop has your items and will start soon.",
  "Your clothes are being washed.",
  "Ready. Come and collect during shop hours.",
  "Collected. Thanks for using LaundryPadi.",
];

const dates = ["2026-09-20", "2026-09-21", "2026-09-22", "2026-09-23"];

/** A looping sample order. It shows the four statuses without needing real data. */
export function TrackerDemo({ compact = false }: { compact?: boolean }) {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setCurrent(2);
      return;
    }
    const id = setInterval(() => setCurrent((c) => (c + 1) % ORDER_STEPS.length), 2600);
    return () => clearInterval(id);
  }, []);

  const status = ORDER_STEPS[current].status;

  return (
    <div className={`card ${compact ? "p-4" : "p-5 sm:p-6"}`} aria-label="Sample order tracker">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-display text-base font-bold sm:text-lg">LP-1042</p>
          <p className="text-sm text-ink-soft">FreshFold Laundry &middot; sample order</p>
        </div>
        <StatusChip key={status} status={status} className="animate-pop" />
      </div>
      <div className={compact ? "mt-4" : "mt-6"}>
        <ProgressTracker current={current} dates={dates.slice(0, current + 1)} animateIn={false} />
      </div>
      <p className="mt-4 text-sm text-ink-soft" aria-live="off">
        {messages[current]}
      </p>
    </div>
  );
}
