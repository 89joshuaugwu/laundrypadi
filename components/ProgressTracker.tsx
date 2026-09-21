"use client";

import { Check } from "lucide-react";
import { useEffect, useState } from "react";
import { formatDate } from "@/lib/site";
import { ORDER_STEPS } from "@/lib/types";

/**
 * Four-step order tracker. `current` is the index of the latest reached step (0 to 3).
 * Reached steps are filled, the connecting lines draw in, and the current step pulses.
 */
export function ProgressTracker({
  current,
  dates,
  animateIn = true,
}: {
  current: number;
  dates?: (string | undefined)[];
  animateIn?: boolean;
}) {
  const [shown, setShown] = useState(animateIn ? -1 : current);

  useEffect(() => {
    const t = setTimeout(() => setShown(current), 120);
    return () => clearTimeout(t);
  }, [current]);

  return (
    <ol className="flex items-start" aria-label="Order progress">
      {ORDER_STEPS.map((step, i) => {
        const done = i <= shown;
        const pulsing = i === shown && shown < ORDER_STEPS.length - 1;
        const date = dates?.[i];
        return (
          <li key={step.status} className="relative flex flex-1 flex-col items-center text-center">
            {i < ORDER_STEPS.length - 1 && (
              <span aria-hidden="true" className="absolute left-1/2 top-4 h-[3px] w-full -translate-y-1/2 rounded-full bg-line">
                <span
                  className="block h-full origin-left rounded-full bg-primary transition-transform duration-700 ease-out"
                  style={{ transform: `scaleX(${i < shown ? 1 : 0})`, transitionDelay: `${i * 160}ms` }}
                />
              </span>
            )}
            <span
              className={`relative z-10 flex h-8 w-8 items-center justify-center rounded-full border-2 transition-all duration-500 ${
                done ? "border-primary bg-primary text-white" : "border-line bg-white"
              } ${pulsing ? "animate-pulse-ring" : ""}`}
              style={{ transitionDelay: done ? `${i * 160}ms` : "0ms" }}
            >
              {done && <Check aria-hidden="true" className="h-4 w-4" strokeWidth={3} />}
            </span>
            <span className={`mt-2 text-xs font-semibold sm:text-sm ${done ? "text-ink" : "text-ink-soft"}`}>
              {step.label}
              {done ? <span className="sr-only"> (done)</span> : null}
            </span>
            <span className="text-xs text-ink-soft">{date ? formatDate(date) : "\u2014"}</span>
          </li>
        );
      })}
    </ol>
  );
}
