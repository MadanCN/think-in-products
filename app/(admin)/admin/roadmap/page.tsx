import type { Metadata } from "next";
import { getPhasesWithCounts } from "@/app/actions/roadmap";
import { RoadmapManager } from "@/components/admin/roadmap/RoadmapManager";

export const dynamic = 'force-dynamic';

export const metadata: Metadata = { title: "Roadmap — Admin" };

export default async function AdminRoadmapPage() {
  let phases: Awaited<ReturnType<typeof getPhasesWithCounts>> = [];
  try {
    phases = await getPhasesWithCounts();
  } catch {
    // serve empty state if Supabase is not configured
  }

  return <RoadmapManager initialPhases={phases} />;
}
