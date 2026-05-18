"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Map } from "lucide-react";
import FilterBar, { type Filter } from "./FilterBar";
import PhaseSection from "./PhaseSection";
import NodeDrawer from "./NodeDrawer";
import type { RoadmapPhaseDB, RoadmapNodeDB } from "@/types";

const STORAGE_KEY = "tip_roadmap_completed";

interface RoadmapClientProps {
  phases: RoadmapPhaseDB[];
}

function countByDifficulty(phases: RoadmapPhaseDB[]) {
  const all = phases.flatMap((p) => p.nodes);
  return {
    all:          all.length,
    beginner:     all.filter((n) => n.difficulty === "beginner").length,
    intermediate: all.filter((n) => n.difficulty === "intermediate").length,
    advanced:     all.filter((n) => n.difficulty === "advanced").length,
  };
}

function scrollToPhase(phaseId: string) {
  document.getElementById(`phase-${phaseId}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

export default function RoadmapClient({ phases }: RoadmapClientProps) {
  const [activeFilter,  setActiveFilter]  = useState<Filter>("all");
  const [selectedNode,  setSelectedNode]  = useState<RoadmapNodeDB | null>(null);
  const [selectedPhase, setSelectedPhase] = useState<RoadmapPhaseDB | null>(null);
  const [completedIds,  setCompletedIds]  = useState<Set<string>>(new Set());

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setCompletedIds(new Set(JSON.parse(saved) as string[]));
    } catch { /* ignore */ }
  }, []);

  const handleComplete = useCallback((nodeId: string) => {
    setCompletedIds((prev) => {
      const next = new Set(prev);
      if (next.has(nodeId)) { next.delete(nodeId); } else { next.add(nodeId); }
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(next))); } catch { /* ignore */ }
      return next;
    });
  }, []);

  const counts = useMemo(() => countByDifficulty(phases), [phases]);

  const filteredPhases = useMemo(
    () =>
      phases.map((phase) => ({
        phase,
        visibleNodes: activeFilter === "all"
          ? phase.nodes
          : phase.nodes.filter((n) => n.difficulty === activeFilter),
      })).filter(({ visibleNodes }) => visibleNodes.length > 0),
    [phases, activeFilter]
  );

  const phasesWithIndex = useMemo(() => {
    let idx = 0;
    return filteredPhases.map(({ phase, visibleNodes }) => {
      const startIndex = idx;
      idx += visibleNodes.length;
      return { phase, visibleNodes, startIndex };
    });
  }, [filteredPhases]);

  // Flat ordered list of all currently-visible nodes (for prev/next)
  const allVisibleNodes = useMemo(
    () => phasesWithIndex.flatMap(({ visibleNodes, phase }) =>
      visibleNodes.map((n) => ({ node: n, phase }))
    ),
    [phasesWithIndex]
  );

  const selectedIdx = useMemo(
    () => selectedNode ? allVisibleNodes.findIndex((x) => x.node.id === selectedNode.id) : -1,
    [selectedNode, allVisibleNodes]
  );

  const totalCompleted = useMemo(() => {
    const allNodeIds = phases.flatMap((p) => p.nodes.map((n) => n.id));
    return allNodeIds.filter((id) => completedIds.has(id)).length;
  }, [phases, completedIds]);

  const totalNodes = useMemo(() => phases.flatMap((p) => p.nodes).length, [phases]);

  const handleNodeClick = useCallback((node: RoadmapNodeDB, phase: RoadmapPhaseDB) => {
    setSelectedNode(node);
    setSelectedPhase(phase);
  }, []);

  const handleClose = useCallback(() => {
    setSelectedNode(null);
    setSelectedPhase(null);
  }, []);

  const handlePrev = useCallback(() => {
    if (selectedIdx > 0) {
      const { node, phase } = allVisibleNodes[selectedIdx - 1];
      setSelectedNode(node);
      setSelectedPhase(phase);
    }
  }, [selectedIdx, allVisibleNodes]);

  const handleNext = useCallback(() => {
    if (selectedIdx < allVisibleNodes.length - 1) {
      const { node, phase } = allVisibleNodes[selectedIdx + 1];
      setSelectedNode(node);
      setSelectedPhase(phase);
    }
  }, [selectedIdx, allVisibleNodes]);

  if (phases.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-6 pb-24">
        <div className="py-24 flex flex-col items-center gap-4 text-center">
          <div className="w-14 h-14 rounded-2xl bg-accent-primary/10 border border-accent-primary/20 flex items-center justify-center">
            <Map className="w-6 h-6 text-accent-primary" strokeWidth={1.5} />
          </div>
          <h2 className="font-display text-xl font-bold text-text-primary">Coming Soon</h2>
          <p className="text-text-secondary text-sm max-w-sm">
            The roadmap is being built out. New modules will appear here as they&rsquo;re published.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="max-w-4xl mx-auto px-6 pb-24">

        {/* Phase navigator */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="mb-6 rounded-2xl border border-border bg-bg-card/50 backdrop-blur-sm p-4"
        >
          <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
            <p className="font-mono text-xs text-text-muted uppercase tracking-wider">Jump to phase</p>
            {totalCompleted > 0 && (
              <p className="font-mono text-xs text-emerald-400">
                {totalCompleted}/{totalNodes} done
              </p>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {phases.map((phase, i) => {
              const phaseCompleted = phase.nodes.filter((n) => completedIds.has(n.id)).length;
              return (
                <button
                  key={phase.id}
                  onClick={() => scrollToPhase(phase.id)}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-mono transition-all hover:scale-[1.03] active:scale-[0.97]"
                  style={{ borderColor: `${phase.color}40`, color: phase.color, background: `${phase.color}10` }}
                >
                  <span className="font-bold">{String(i + 1).padStart(2, "0")}</span>
                  <span className="text-text-secondary hidden sm:inline">{phase.title}</span>
                  {phaseCompleted > 0 && (
                    <span className="px-1 py-0.5 rounded text-[10px] font-bold" style={{ background: `${phase.color}20`, color: phase.color }}>
                      {phaseCompleted}/{phase.nodes.length}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          {totalCompleted > 0 && (
            <div className="mt-3 h-1 rounded-full bg-white/5 overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-accent-primary to-accent-secondary"
                initial={{ width: 0 }}
                animate={{ width: `${(totalCompleted / totalNodes) * 100}%` }}
                transition={{ duration: 0.6, ease: "easeOut" }}
              />
            </div>
          )}
        </motion.div>

        {/* Filter bar */}
        <div className="mb-8">
          <FilterBar active={activeFilter} onChange={setActiveFilter} counts={counts} />
        </div>

        {/* Phase sections */}
        <AnimatePresence mode="sync">
          {phasesWithIndex.length > 0 ? (
            <div className="space-y-4">
              {phasesWithIndex.map(({ phase, visibleNodes, startIndex }, idx) => (
                <PhaseSection
                  key={phase.id}
                  phase={phase}
                  visibleNodes={visibleNodes}
                  isLast={idx === phasesWithIndex.length - 1}
                  startIndex={startIndex}
                  completedIds={completedIds}
                  onNodeClick={(node) => handleNodeClick(node, phase)}
                  onComplete={handleComplete}
                />
              ))}
            </div>
          ) : (
            <div className="py-24 flex flex-col items-center gap-3 text-center">
              <p className="font-display text-lg font-bold text-text-primary">
                No modules match &ldquo;{activeFilter}&rdquo;
              </p>
              <button onClick={() => setActiveFilter("all")} className="mt-2 text-sm text-accent-primary hover:underline">
                Clear filter
              </button>
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* Slide-over drawer */}
      <AnimatePresence>
        {selectedNode && selectedPhase && (
          <NodeDrawer
            key={selectedNode.id}
            node={selectedNode}
            phaseColor={selectedPhase.color}
            hasPrev={selectedIdx > 0}
            hasNext={selectedIdx < allVisibleNodes.length - 1}
            onPrev={handlePrev}
            onNext={handleNext}
            onClose={handleClose}
          />
        )}
      </AnimatePresence>
    </>
  );
}
