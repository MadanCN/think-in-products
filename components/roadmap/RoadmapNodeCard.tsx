"use client";

import { motion } from "framer-motion";
import { Clock, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { RoadmapNodeDB } from "@/types";

interface RoadmapNodeCardProps {
  node: RoadmapNodeDB;
  phaseColor: string;
  onClick: (node: RoadmapNodeDB) => void;
}

const DIFFICULTY_STYLES = {
  beginner:     "bg-emerald-500/10 text-emerald-400 border-emerald-500/25",
  intermediate: "bg-amber-500/10   text-amber-400   border-amber-500/25",
  advanced:     "bg-rose-500/10    text-rose-400    border-rose-500/25",
} as const;

export default function RoadmapNodeCard({
  node,
  phaseColor,
  onClick,
}: RoadmapNodeCardProps) {
  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -3 }}
      onClick={() => onClick(node)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") onClick(node); }}
      aria-label={`Open ${node.title}`}
      className={cn(
        "group relative cursor-pointer rounded-2xl p-5 flex flex-col gap-4",
        "bg-bg-card/60 border border-white/5 backdrop-blur-sm",
        "transition-all duration-200 outline-none",
        "hover:border-accent-primary/30 hover:shadow-glow-teal hover:bg-bg-card/80",
        "focus-visible:ring-2 focus-visible:ring-accent-primary/50 focus-visible:ring-offset-1 focus-visible:ring-offset-bg-primary"
      )}
    >
      {/* Phase-color accent bar */}
      <div
        className="absolute top-0 left-5 right-5 h-px rounded-full opacity-60"
        style={{ backgroundColor: phaseColor }}
      />

      {/* Header row */}
      <div className="flex items-start justify-between gap-3">
        <span
          className={cn(
            "inline-flex items-center px-2.5 py-0.5 rounded-full text-2xs font-mono font-semibold border",
            DIFFICULTY_STYLES[node.difficulty]
          )}
        >
          {node.difficulty}
        </span>
        <div className="flex items-center gap-1 shrink-0 text-text-muted">
          <Clock className="w-3 h-3" strokeWidth={1.5} />
          <span className="font-mono text-xs">~{node.estimated_hours}h</span>
        </div>
      </div>

      {/* Title */}
      <h3 className="font-display text-base font-bold text-text-primary group-hover:text-accent-primary transition-colors line-clamp-2 leading-snug">
        {node.title}
      </h3>

      {/* Summary */}
      <p className="text-text-secondary text-sm leading-relaxed line-clamp-2 flex-1">
        {node.summary}
      </p>

      {/* Footer */}
      <div className="flex items-center justify-between gap-2 pt-1">
        {/* Tags */}
        <div className="flex flex-wrap gap-1 min-w-0">
          {node.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="font-mono text-2xs px-2 py-0.5 rounded bg-bg-secondary border border-border text-text-muted truncate max-w-[80px]"
            >
              {tag}
            </span>
          ))}
        </div>

        {/* Explore CTA */}
        <span className="shrink-0 inline-flex items-center gap-1 text-xs font-medium text-text-muted group-hover:text-accent-primary transition-colors">
          Explore
          <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
        </span>
      </div>
    </motion.article>
  );
}
