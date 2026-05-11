"use client";

import { useState, useMemo, useCallback } from "react";
import { AnimatePresence } from "framer-motion";
import FilterBar, { type Filter } from "./FilterBar";
import PhaseSection from "./PhaseSection";
import NodeDrawer from "./NodeDrawer";
import type { RoadmapPhaseDB, RoadmapNodeDB } from "@/types";

interface RoadmapClientProps {
  phases: RoadmapPhaseDB[];
}

// Pre-compute how many nodes exist per difficulty across all phases
function countByDifficulty(phases: RoadmapPhaseDB[]) {
  const all = phases.flatMap((p) => p.nodes);
  return {
    all:          all.length,
    beginner:     all.filter((n) => n.difficulty === "beginner").length,
    intermediate: all.filter((n) => n.difficulty === "intermediate").length,
    advanced:     all.filter((n) => n.difficulty === "advanced").length,
  };
}

export default function RoadmapClient({ phases }: RoadmapClientProps) {
  const [activeFilter,  setActiveFilter]  = useState<Filter>("all");
  const [selectedNode,  setSelectedNode]  = useState<RoadmapNodeDB | null>(null);
  const [selectedPhase, setSelectedPhase] = useState<RoadmapPhaseDB | null>(null);

  const counts = useMemo(() => countByDifficulty(phases), [phases]);

  // Filter nodes per phase; hide phases that have zero visible nodes
  const filteredPhases = useMemo(
    () =>
      phases
        .map((phase) => ({
          phase,
          visibleNodes:
            activeFilter === "all"
              ? phase.nodes
              : phase.nodes.filter((n) => n.difficulty === activeFilter),
        }))
        .filter(({ visibleNodes }) => visibleNodes.length > 0),
    [phases, activeFilter]
  );

  const handleNodeClick = useCallback(
    (node: RoadmapNodeDB, phase: RoadmapPhaseDB) => {
      setSelectedNode(node);
      setSelectedPhase(phase);
    },
    []
  );

  const handleClose = useCallback(() => {
    setSelectedNode(null);
    setSelectedPhase(null);
  }, []);

  // ── Empty state (all nodes filtered out) ────────────────────
  if (phases.length === 0) {
    return (
      <div className="max-w-5xl mx-auto px-6 pb-24">
        <div className="py-24 flex flex-col items-center gap-4 text-center">
          <div className="w-14 h-14 rounded-2xl bg-accent-primary/10 border border-accent-primary/20 flex items-center justify-center text-2xl">
            🗺️
          </div>
          <h2 className="font-display text-xl font-bold text-text-primary">
            Roadmap coming soon
          </h2>
          <p className="text-text-secondary text-sm max-w-sm">
            Connect your Supabase project and run the migrations to populate the roadmap. See the setup guide in the project README.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="max-w-5xl mx-auto px-6 pb-24">

        {/* Filter bar */}
        <div className="mb-12">
          <FilterBar
            active={activeFilter}
            onChange={setActiveFilter}
            counts={counts}
          />
        </div>

        {/* All phases with filtered nodes */}
        <AnimatePresence mode="sync">
          {filteredPhases.length > 0 ? (
            <div className="space-y-16">
              {filteredPhases.map(({ phase, visibleNodes }, idx) => (
                <PhaseSection
                  key={phase.id}
                  phase={phase}
                  visibleNodes={visibleNodes}
                  isLast={idx === filteredPhases.length - 1}
                  onNodeClick={(node) => handleNodeClick(node, phase)}
                />
              ))}
            </div>
          ) : (
            <div className="py-24 flex flex-col items-center gap-3 text-center">
              <p className="font-display text-lg font-bold text-text-primary">
                No modules match &ldquo;{activeFilter}&rdquo;
              </p>
              <p className="text-text-secondary text-sm">
                Try a different difficulty level.
              </p>
              <button
                onClick={() => setActiveFilter("all")}
                className="mt-2 text-sm text-accent-primary hover:underline"
              >
                Clear filter
              </button>
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* Slide-over drawer — portalled above everything */}
      <AnimatePresence>
        {selectedNode && selectedPhase && (
          <NodeDrawer
            key={selectedNode.id}
            node={selectedNode}
            phaseColor={selectedPhase.color}
            onClose={handleClose}
          />
        )}
      </AnimatePresence>
    </>
  );
}
