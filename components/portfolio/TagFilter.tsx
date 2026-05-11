"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface TagFilterProps {
  tags: string[];
  active: string | null;
  onChange: (tag: string | null) => void;
}

export function TagFilter({ tags, active, onChange }: TagFilterProps) {
  if (tags.length === 0) return null;

  return (
    <div role="group" aria-label="Filter by tag" className="flex flex-wrap gap-2">
      <button
        onClick={() => onChange(null)}
        aria-pressed={active === null}
        className={cn(
          "relative px-4 py-1.5 rounded-full text-sm font-medium border transition-all duration-150",
          "focus-visible:ring-2 focus-visible:ring-accent-primary/50 focus-visible:ring-offset-1 focus-visible:ring-offset-bg-primary",
          active === null
            ? "border-accent-primary/50 text-accent-primary"
            : "border-border text-text-secondary hover:border-border-glow hover:text-text-primary"
        )}
      >
        {active === null && (
          <motion.span
            layoutId="tag-pill"
            className="absolute inset-0 rounded-full bg-accent-primary/10"
            transition={{ type: "spring", stiffness: 400, damping: 35 }}
          />
        )}
        <span className="relative">All</span>
      </button>

      {tags.map((tag) => (
        <button
          key={tag}
          onClick={() => onChange(active === tag ? null : tag)}
          aria-pressed={active === tag}
          className={cn(
            "relative px-4 py-1.5 rounded-full text-sm font-medium border transition-all duration-150",
            "focus-visible:ring-2 focus-visible:ring-accent-primary/50 focus-visible:ring-offset-1 focus-visible:ring-offset-bg-primary",
            active === tag
              ? "border-accent-primary/50 text-accent-primary"
              : "border-border text-text-secondary hover:border-border-glow hover:text-text-primary"
          )}
        >
          {active === tag && (
            <motion.span
              layoutId="tag-pill"
              className="absolute inset-0 rounded-full bg-accent-primary/10"
              transition={{ type: "spring", stiffness: 400, damping: 35 }}
            />
          )}
          <span className="relative">{tag}</span>
        </button>
      ))}
    </div>
  );
}
