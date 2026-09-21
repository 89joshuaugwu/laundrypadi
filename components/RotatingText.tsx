"use client";

import { useEffect, useState } from "react";

/**
 * Cycles through words in place. All words share one grid cell, so the box is always as wide as
 * the longest word and the layout never shifts. Screen readers get the full list once.
 */
export function RotatingText({
  words,
  interval = 2400,
  className = "",
}: {
  words: string[];
  interval?: number;
  className?: string;
}) {
  const [active, setActive] = useState(0);
  const [previous, setPrevious] = useState(-1);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = setInterval(() => {
      setActive((a) => {
        setPrevious(a);
        return (a + 1) % words.length;
      });
    }, interval);
    return () => clearInterval(id);
  }, [words.length, interval]);

  return (
    <span className={`relative inline-grid overflow-hidden pb-1 align-bottom ${className}`}>
      <span className="sr-only">{words.join(", ")}</span>
      {words.map((word, i) => {
        const state =
          i === active
            ? "translate-y-0 opacity-100 transition-all duration-500 ease-out"
            : i === previous
              ? "-translate-y-full opacity-0 transition-all duration-500 ease-out"
              : "translate-y-full opacity-0";
        return (
          <span key={word} aria-hidden="true" className={`col-start-1 row-start-1 ${state}`}>
            {word}
          </span>
        );
      })}
    </span>
  );
}
