"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { NodeDifficulty } from "@/types";

type Filter = "all" | NodeDifficulty;

interface FilterBarProps {
  active: Filter;
  onChange: (filter: Filter) => void;
  counts: Record<Filter, number>;
}

const FILTERS: { value: Filter; label: string }[] = [
  { value: "all",          label: "All"          },
  { value: "beginner",     label: "Beginner"     },
  { value: "intermediate", label: "Intermediate" },
  { value: "advanced",     label: "Advanced"     },
];

const DIFFICULTY_DOT: Record<NodeDifficulty, string> = {
  beginner:     "bg-emerald-400",
  intermediate: "bg-amber-400",
  advanced:     "bg-rose-400",
};

export default function FilterBar({ active, onChange, counts }: FilterBarProps) {
  return (
    <div
      role="group"
      aria-label="Filter by difficulty"
      className="flex flex-wrap items-center gap-2"
    >
      {FILTERS.map(({ value, label }) => {
        const isActive = active === value;
        const count = counts[value];

        return (
          <button
            key={value}
            onClick={() => onChange(value)}
            aria-pressed={isActive}
            className={cn(
              "relative inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium",
              "border transition-all duration-150 outline-none",
              "focus-visible:ring-2 focus-visible:ring-accent-primary/50 focus-visible:ring-offset-1 focus-visible:ring-offset-bg-primary",
              isActive
                ? "border-accent-primary/50 text-accent-primary bg-accent-primary/10"
                : "border-border text-text-secondary hover:border-border-glow hover:text-text-primary bg-transparent"
            )}
          >
            {/* Animated background pill */}
            {isActive && (
              <motion.span
                layoutId="filter-pill"
                className="absolute inset-0 rounded-full bg-accent-primary/10"
                transition={{ type: "spring", stiffness: 400, damping: 35 }}
              />
            )}

            {/* Difficulty colour dot (not on "All") */}
            {value !== "all" && (
              <span
                className={cn(
                  "relative w-1.5 h-1.5 rounded-full shrink-0",
                  DIFFICULTY_DOT[value as NodeDifficulty]
                )}
              />
            )}

            <span className="relative">{label}</span>

            {/* Count badge */}
            {count > 0 && (
              <span
                className={cn(
                  "relative font-mono text-xs px-1.5 py-0.5 rounded-md",
                  isActive
                    ? "bg-accent-primary/20 text-accent-primary"
                    : "bg-white/5 text-text-muted"
                )}
              >
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export type { Filter };
