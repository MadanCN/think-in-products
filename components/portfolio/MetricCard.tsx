"use client";

import { useRef, useState, useEffect } from "react";
import { useInView } from "framer-motion";
import type { MetricItem } from "@/types";

function parseValue(raw: string): {
  prefix: string;
  number: number | null;
  suffix: string;
} {
  // Match patterns like "34%", "3×", "↑ 3×", "40", "$2.1M"
  const m = raw.match(/^(.*?)(\d+(?:\.\d+)?)(.*?)$/);
  if (m) {
    return { prefix: m[1], number: parseFloat(m[2]), suffix: m[3] };
  }
  return { prefix: "", number: null, suffix: raw };
}

export function MetricCard({ label, value }: MetricItem) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-40px" });
  const [displayed, setDisplayed] = useState("");
  const hasAnimated = useRef(false);

  const { prefix, number, suffix } = parseValue(value);

  useEffect(() => {
    if (!isInView || hasAnimated.current) return;
    hasAnimated.current = true;

    if (number === null) {
      setDisplayed(value);
      return;
    }

    const duration = 1300;
    const startTime = performance.now();

    function tick(now: number) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = number! % 1 === 0
        ? Math.floor(eased * number!)
        : Math.round(eased * number! * 10) / 10;

      setDisplayed(`${prefix}${current}${suffix}`);

      if (progress < 1) {
        requestAnimationFrame(tick);
      } else {
        setDisplayed(value); // ensure exact final value
      }
    }

    requestAnimationFrame(tick);
  }, [isInView, number, value, prefix, suffix]);

  return (
    <div
      ref={ref}
      className="flex flex-col items-center gap-2 px-6 py-5 rounded-2xl bg-accent-primary/5 border border-accent-primary/15"
    >
      <span className="font-display text-3xl md:text-4xl font-extrabold text-accent-primary tracking-tight tabular-nums">
        {displayed || (number !== null ? `${prefix}0${suffix}` : value)}
      </span>
      <span className="font-mono text-xs text-text-muted text-center leading-snug max-w-[120px]">
        {label}
      </span>
    </div>
  );
}
