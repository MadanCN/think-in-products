"use client";

import { useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Clock } from "lucide-react";
import RoadmapNodeCard from "./RoadmapNodeCard";
import type { RoadmapPhaseDB, RoadmapNodeDB } from "@/types";

interface PhaseSectionProps {
  phase: RoadmapPhaseDB;
  visibleNodes: RoadmapNodeDB[];
  isLast: boolean;
  startIndex: number;
  completedIds: Set<string>;
  onNodeClick: (node: RoadmapNodeDB) => void;
  onComplete: (id: string) => void;
}

export default function PhaseSection({
  phase,
  visibleNodes,
  isLast,
  startIndex,
  completedIds,
  onNodeClick,
  onComplete,
}: PhaseSectionProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const phaseNum = String(phase.order_index + 1).padStart(2, "0");
  const completedCount = visibleNodes.filter((n) => completedIds.has(n.id)).length;
  const totalHours = phase.nodes.reduce((a, n) => a + n.estimated_hours, 0);
  const progress = visibleNodes.length > 0 ? (completedCount / visibleNodes.length) * 100 : 0;

  return (
    <section ref={sectionRef} id={`phase-${phase.id}`} aria-labelledby={`phase-${phase.id}-heading`}>
      {/* ── Phase header ── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="mb-8 rounded-2xl border overflow-hidden"
        style={{ borderColor: `${phase.color}30` }}
      >
        {/* Progress bar */}
        <div className="h-1 w-full bg-white/5">
          <motion.div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${progress}%`, backgroundColor: phase.color }}
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
          />
        </div>

        <div className="px-6 py-5" style={{ background: `${phase.color}08` }}>
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span
                  className="font-mono text-xs font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full border"
                  style={{ color: phase.color, borderColor: `${phase.color}40`, background: `${phase.color}15` }}
                >
                  Phase {phaseNum}
                </span>
                {completedCount > 0 && (
                  <span className="font-mono text-xs text-emerald-400">
                    {completedCount}/{visibleNodes.length} done
                  </span>
                )}
              </div>
              <h2
                id={`phase-${phase.id}-heading`}
                className="font-display text-2xl md:text-3xl font-bold text-text-primary"
              >
                {phase.title}
              </h2>
              {phase.description && (
                <p className="text-text-secondary leading-relaxed max-w-2xl text-sm">
                  {phase.description}
                </p>
              )}
            </div>

            {/* Stats */}
            <div className="flex flex-col items-end gap-1 shrink-0">
              <span className="font-mono text-xs text-text-muted">
                {phase.nodes.length} module{phase.nodes.length !== 1 ? "s" : ""}
              </span>
              <span className="flex items-center gap-1 font-mono text-xs text-text-muted">
                <Clock className="w-3 h-3" />
                ~{totalHours}h total
              </span>
              {progress > 0 && (
                <span className="font-mono text-xs" style={{ color: phase.color }}>
                  {Math.round(progress)}% complete
                </span>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── Node list ── */}
      <div className="ml-2">
        <AnimatePresence mode="popLayout">
          {visibleNodes.length > 0 ? (
            visibleNodes.map((node, i) => (
              <RoadmapNodeCard
                key={node.id}
                node={node}
                phaseColor={phase.color}
                stepNumber={startIndex + i + 1}
                isLast={i === visibleNodes.length - 1}
                isCompleted={completedIds.has(node.id)}
                onComplete={onComplete}
                onClick={onNodeClick}
              />
            ))
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="py-8 flex flex-col items-center gap-3 text-center"
            >
              <p className="text-text-muted text-sm font-mono">No modules match this filter in this phase.</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Phase connector ── */}
      {!isLast && (
        <div className="flex justify-start ml-6 mt-2 mb-12" aria-hidden="true">
          <motion.div
            initial={{ opacity: 0, scaleY: 0 }}
            whileInView={{ opacity: 1, scaleY: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex flex-col items-center gap-1"
            style={{ originY: 0 }}
          >
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="w-px h-3 rounded-full"
                style={{ background: phase.color, opacity: 0.15 + (i % 2 === 0 ? 0.1 : 0) }}
              />
            ))}
            <div
              className="w-2 h-2 rounded-full mt-1"
              style={{ backgroundColor: `${phase.color}60` }}
            />
          </motion.div>
        </div>
      )}
    </section>
  );
}
