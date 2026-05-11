"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";
import RoadmapNodeCard from "./RoadmapNodeCard";
import type { RoadmapPhaseDB, RoadmapNodeDB } from "@/types";

interface PhaseSectionProps {
  phase: RoadmapPhaseDB;
  visibleNodes: RoadmapNodeDB[];
  isLast: boolean;
  onNodeClick: (node: RoadmapNodeDB) => void;
}

function EmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="col-span-full py-10 flex flex-col items-center gap-3 text-center"
    >
      <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center">
        <span className="text-lg">🔍</span>
      </div>
      <p className="text-text-muted text-sm font-mono">
        No modules match this filter in this phase.
      </p>
    </motion.div>
  );
}

export default function PhaseSection({
  phase,
  visibleNodes,
  isLast,
  onNodeClick,
}: PhaseSectionProps) {
  const phaseNum = String(phase.order_index).padStart(2, "0");

  return (
    <section aria-labelledby={`phase-${phase.id}-heading`}>
      {/* Phase header — viewport-triggered entrance */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        className="mb-8 pl-5"
        style={{ borderLeft: `3px solid ${phase.color}` }}
      >
        <p
          className="font-mono text-xs font-semibold mb-2 uppercase tracking-widest"
          style={{ color: phase.color }}
        >
          Phase {phaseNum}
        </p>

        <h2
          id={`phase-${phase.id}-heading`}
          className="font-display text-2xl md:text-3xl font-bold text-text-primary mb-3"
        >
          {phase.title}
        </h2>

        <p className="text-text-secondary leading-relaxed max-w-2xl">
          {phase.description}
        </p>

        <p className="font-mono text-xs text-text-muted mt-3">
          {phase.nodes.length} module{phase.nodes.length !== 1 ? "s" : ""}
          {visibleNodes.length !== phase.nodes.length &&
            ` · ${visibleNodes.length} visible`}
        </p>
      </motion.div>

      {/* Node grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <AnimatePresence mode="popLayout">
          {visibleNodes.length > 0 ? (
            visibleNodes.map((node) => (
              <RoadmapNodeCard
                key={node.id}
                node={node}
                phaseColor={phase.color}
                onClick={onNodeClick}
              />
            ))
          ) : (
            <EmptyState key="empty" />
          )}
        </AnimatePresence>
      </div>

      {/* Phase connector — flowchart arrow between phases */}
      {!isLast && (
        <div className="flex justify-center mt-12 mb-2" aria-hidden="true">
          <motion.div
            initial={{ opacity: 0, scaleY: 0 }}
            whileInView={{ opacity: 1, scaleY: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="flex flex-col items-center gap-0.5"
            style={{ originY: 0 }}
          >
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="w-px h-3 bg-border"
                style={{ opacity: 1 - i * 0.15 }}
              />
            ))}
            <ChevronDown
              className="w-4 h-4 text-text-muted"
              strokeWidth={1.5}
            />
          </motion.div>
        </div>
      )}
    </section>
  );
}
