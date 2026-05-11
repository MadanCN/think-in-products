import type { Metadata } from "next";
import { Badge } from "@/components/ui";
import { createServerAnonClient } from "@/lib/supabase";
import type { RoadmapPhaseDB } from "@/types";
import RoadmapClient from "@/components/roadmap/RoadmapClient";

export const metadata: Metadata = {
  title: "PM Roadmap",
  description:
    "A structured, phase-by-phase path to becoming a product manager — from foundations to advanced strategy. Each module is focused, opinionated, and built for real skill development.",
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
            Living Document · Updated Regularly
          </Badge>

          <h1 className="font-display text-4xl md:text-5xl font-extrabold text-text-primary tracking-tight">
            The PM Roadmap
          </h1>

          <p className="text-text-secondary text-lg leading-relaxed">
            Four phases. Focused modules. No busywork. Work through them
            sequentially or jump to whatever you need — each node is a
            self-contained piece of craft, not a reading list.
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
