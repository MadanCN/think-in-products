"use client";

import { motion } from "framer-motion";
import { Clock, ArrowRight, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { RoadmapNodeDB } from "@/types";

interface RoadmapNodeCardProps {
  node: RoadmapNodeDB;
  phaseColor: string;
  stepNumber: number;
  isLast: boolean;
  isCompleted: boolean;
  onComplete: (id: string) => void;
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
  stepNumber,
  isLast,
  isCompleted,
  onComplete,
  onClick,
}: RoadmapNodeCardProps) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -16 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -16 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className="flex gap-5"
    >
      {/* ── Timeline column ── */}
      <div className="flex flex-col items-center shrink-0 w-10">
        {/* Step circle — click to mark done */}
        <button
          onClick={(e) => { e.stopPropagation(); onComplete(node.id); }}
          title={isCompleted ? "Mark as not done" : "Mark as done"}
          className={cn(
            "relative w-9 h-9 rounded-full border-2 flex items-center justify-center text-xs font-mono font-bold transition-all duration-200 mt-0.5 shrink-0 group/step",
            isCompleted
              ? "border-transparent bg-emerald-500 text-white shadow-[0_0_12px_rgba(16,185,129,0.4)]"
              : "bg-bg-primary text-text-muted hover:text-text-primary"
          )}
          style={!isCompleted ? { borderColor: phaseColor, color: phaseColor } : undefined}
        >
          {isCompleted ? (
            <CheckCircle2 className="w-4 h-4" />
          ) : (
            <span>{stepNumber}</span>
          )}
        </button>

        {/* Connector line */}
        {!isLast && (
          <div
            className="w-px flex-1 mt-2 min-h-[24px] rounded-full transition-colors duration-300"
            style={{ background: isCompleted ? "rgba(16,185,129,0.35)" : `${phaseColor}25` }}
          />
        )}
      </div>

      {/* ── Card ── */}
      <div className="flex-1 pb-6">
        <motion.article
          whileHover={{ y: -2 }}
          onClick={() => onClick(node)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") onClick(node); }}
          aria-label={`Open ${node.title}`}
          className={cn(
            "group cursor-pointer rounded-2xl p-5 border transition-all duration-200 outline-none",
            "backdrop-blur-sm",
            isCompleted
              ? "bg-emerald-500/5 border-emerald-500/20 hover:border-emerald-500/40"
              : "bg-bg-card/60 border-white/5 hover:bg-bg-card/80 hover:shadow-glow-teal",
            "focus-visible:ring-2 focus-visible:ring-accent-primary/50"
          )}
          style={!isCompleted ? { borderColor: undefined } : undefined}
        >
          {/* Phase accent line */}
          {!isCompleted && (
            <div
              className="absolute top-0 left-5 right-5 h-px rounded-full opacity-40"
              style={{ backgroundColor: phaseColor }}
            />
          )}

          <div className="flex flex-col sm:flex-row sm:items-start gap-3">
            <div className="flex-1 min-w-0 space-y-2">
              {/* Header row */}
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  className={cn(
                    "inline-flex items-center px-2.5 py-0.5 rounded-full text-2xs font-mono font-semibold border",
                    DIFFICULTY_STYLES[node.difficulty]
                  )}
                >
                  {node.difficulty}
                </span>
                <div className="flex items-center gap-1 text-text-muted">
                  <Clock className="w-3 h-3" strokeWidth={1.5} />
                  <span className="font-mono text-xs">~{node.estimated_hours}h</span>
                </div>
                {isCompleted && (
                  <span className="font-mono text-xs text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Done
                  </span>
                )}
              </div>

              {/* Title */}
              <h3 className={cn(
                "font-display text-base font-bold leading-snug transition-colors",
                isCompleted
                  ? "text-text-secondary line-through decoration-emerald-500/50"
                  : "text-text-primary group-hover:text-accent-primary"
              )}>
                {node.title}
              </h3>

              {/* Summary */}
              {node.summary && (
                <p className="text-text-secondary text-sm leading-relaxed line-clamp-2">
                  {node.summary}
                </p>
              )}

              {/* Tags + CTA */}
              <div className="flex items-center justify-between gap-2 pt-1">
                <div className="flex flex-wrap gap-1">
                  {node.tags.slice(0, 4).map((tag) => (
                    <span
                      key={tag}
                      className="font-mono text-2xs px-2 py-0.5 rounded bg-bg-secondary border border-border text-text-muted"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                <span className="shrink-0 inline-flex items-center gap-1 text-xs font-medium text-text-muted group-hover:text-accent-primary transition-colors whitespace-nowrap">
                  Explore <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                </span>
              </div>
            </div>
          </div>
        </motion.article>
      </div>
    </motion.div>
  );
}
