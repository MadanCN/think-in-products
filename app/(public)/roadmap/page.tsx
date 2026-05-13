import type { Metadata } from "next";
import { Badge } from "@/components/ui";
import { createServerAnonClient } from "@/lib/supabase";
import type { RoadmapPhaseDB } from "@/types";
import RoadmapClient from "@/components/roadmap/RoadmapClient";

export const metadata: Metadata = {
  title: "PM Roadmap",
  description:
    "My structured notes on product work — documented as I learn. Each module covers what I've tested and found useful, built in public for anyone on the same journey.",
};

// Revalidate once per hour — roadmap changes infrequently
export const revalidate = 3600;

async function getRoadmapData(): Promise<RoadmapPhaseDB[]> {
  try {
    const supabase = createServerAnonClient();
    const { data, error } = await supabase.rpc("get_roadmap_with_nodes");

    if (error) {
      console.error("[roadmap] RPC error:", error.message);
      return [];
    }

    return (data as unknown as RoadmapPhaseDB[]) ?? [];
  } catch (err) {
    // Supabase not configured (local dev without .env.local) — return empty
    console.warn("[roadmap] Supabase not available:", err);
    return [];
  }
}

export default async function RoadmapPage() {
  const phases = await getRoadmapData();

  return (
    <div className="min-h-screen">
      {/* ── Page header ── */}
      <div className="max-w-5xl mx-auto px-6 pt-32 pb-12">
        <div className="space-y-5 max-w-2xl">
          <Badge variant="solid" className="font-mono">
            Living Document · Built in Public
          </Badge>

          <h1 className="font-display text-4xl md:text-5xl font-extrabold text-text-primary tracking-tight">
            The PM Roadmap
          </h1>

          <p className="text-text-secondary text-lg leading-relaxed">
            My structured notes on product work, organised by phase.
            Each module is what I&rsquo;ve actually learned and tested — not a
            reading list, a knowledge base built in public as I go.
          </p>

          {phases.length > 0 && (
            <p className="font-mono text-sm text-text-muted">
              {phases.reduce((acc, p) => acc + p.nodes.length, 0)} modules across{" "}
              {phases.length} phases
            </p>
          )}
        </div>
      </div>

      {/* ── Interactive client layer ── */}
      <RoadmapClient phases={phases} />
    </div>
  );
}
