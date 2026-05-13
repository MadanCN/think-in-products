"use server";

import { createServerSupabaseClient } from "@/lib/supabase";
import { revalidatePath } from "next/cache";
import { logActivity } from "./activity";

// ─── Shared types ─────────────────────────────────────────────────────────────

export interface AdminPhase {
  id: string;
  title: string;
  description: string | null;
  order_index: number;
  color: string;
  node_count: number;
}

export interface AdminNode {
  id: string;
  phase_id: string;
  title: string;
  summary: string | null;
  description: string | null;
  difficulty: "beginner" | "intermediate" | "advanced";
  estimated_hours: number;
  order_index: number;
  is_published: boolean;
  tags: string[];
  resources: Array<{
    label: string;
    url: string;
    type: "article" | "book" | "video" | "tool";
  }>;
}

export type PhaseInput = Pick<
  AdminPhase,
  "title" | "description" | "color" | "order_index"
>;

export type NodeInput = Omit<AdminNode, "id" | "order_index">;

// ─── Phase actions ────────────────────────────────────────────────────────────

export async function getPhasesWithCounts(): Promise<AdminPhase[]> {
  const db = createServerSupabaseClient();
  const { data, error } = await db
    .from("roadmap_phases")
    .select("id, title, description, order_index, color, roadmap_nodes(id)")
    .order("order_index", { ascending: true });

  if (error) throw new Error(error.message);

  return (data ?? []).map((p) => ({
    id: p.id,
    title: p.title,
    description: p.description,
    order_index: p.order_index,
    color: p.color,
    node_count: Array.isArray(p.roadmap_nodes) ? p.roadmap_nodes.length : 0,
  }));
}

export async function createPhase(
  input: Omit<PhaseInput, "order_index">
): Promise<AdminPhase> {
  const db = createServerSupabaseClient();

  const { data: max } = await db
    .from("roadmap_phases")
    .select("order_index")
    .order("order_index", { ascending: false })
    .limit(1)
    .maybeSingle();

  const order_index = (max?.order_index ?? -1) + 1;

  const { data, error } = await db
    .from("roadmap_phases")
    .insert({ ...input, order_index })
    .select()
    .single();

  if (error) throw new Error(error.message);
  revalidatePath("/admin/roadmap");
  revalidatePath("/");
  revalidatePath("/roadmap");
  void logActivity({ action: "roadmap_phase_created", entity_type: "roadmap_phase", entity_name: data.title });
  return { ...data, node_count: 0 };
}

export async function updatePhase(
  id: string,
  input: Partial<PhaseInput>
): Promise<AdminPhase> {
  const db = createServerSupabaseClient();
  const { data, error } = await db
    .from("roadmap_phases")
    .update(input)
    .eq("id", id)
    .select("id, title, description, order_index, color, roadmap_nodes(id)")
    .single();

  if (error) throw new Error(error.message);
  revalidatePath("/admin/roadmap");
  revalidatePath("/");
  revalidatePath("/roadmap");
  return {
    ...data,
    node_count: Array.isArray(data.roadmap_nodes)
      ? data.roadmap_nodes.length
      : 0,
  };
}

export async function deletePhase(id: string): Promise<void> {
  const db = createServerSupabaseClient();
  const { count } = await db
    .from("roadmap_nodes")
    .select("id", { count: "exact", head: true })
    .eq("phase_id", id);
  if ((count ?? 0) > 0) {
    throw new Error("Cannot delete a phase that still has nodes. Remove all nodes first.");
  }
  const { data: row } = await db.from("roadmap_phases").select("title").eq("id", id).maybeSingle();
  const { error } = await db.from("roadmap_phases").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/roadmap");
  revalidatePath("/");
  revalidatePath("/roadmap");
  void logActivity({ action: "roadmap_phase_deleted", entity_type: "roadmap_phase", entity_name: (row as { title?: string } | null)?.title });
}

export async function reorderPhases(orderedIds: string[]): Promise<void> {
  const db = createServerSupabaseClient();
  await Promise.all(
    orderedIds.map((id, index) =>
      db
        .from("roadmap_phases")
        .update({ order_index: index })
        .eq("id", id)
    )
  );
  revalidatePath("/admin/roadmap");
  revalidatePath("/");
  revalidatePath("/roadmap");
}

// ─── Node actions ─────────────────────────────────────────────────────────────

export async function getNodesForPhase(phaseId: string): Promise<AdminNode[]> {
  const db = createServerSupabaseClient();
  const { data, error } = await db
    .from("roadmap_nodes")
    .select("*")
    .eq("phase_id", phaseId)
    .order("order_index", { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []) as AdminNode[];
}

export async function createNode(input: NodeInput): Promise<AdminNode> {
  const db = createServerSupabaseClient();

  const { data: max } = await db
    .from("roadmap_nodes")
    .select("order_index")
    .eq("phase_id", input.phase_id)
    .order("order_index", { ascending: false })
    .limit(1)
    .maybeSingle();

  const order_index = (max?.order_index ?? -1) + 1;

  const { data, error } = await db
    .from("roadmap_nodes")
    .insert({ ...input, order_index })
    .select()
    .single();

  if (error) throw new Error(error.message);
  revalidatePath("/admin/roadmap");
  revalidatePath("/");
  revalidatePath("/roadmap");
  void logActivity({ action: "roadmap_node_created", entity_type: "roadmap_node", entity_name: (data as AdminNode).title });
  return data as AdminNode;
}

export async function updateNode(
  id: string,
  input: Partial<NodeInput>
): Promise<AdminNode> {
  const db = createServerSupabaseClient();
  const { data, error } = await db
    .from("roadmap_nodes")
    .update({ ...input, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  revalidatePath("/admin/roadmap");
  revalidatePath("/");
  revalidatePath("/roadmap");
  return data as AdminNode;
}

export async function deleteNode(id: string): Promise<void> {
  const db = createServerSupabaseClient();
  const { data: row } = await db.from("roadmap_nodes").select("title").eq("id", id).maybeSingle();
  const { error } = await db.from("roadmap_nodes").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/roadmap");
  revalidatePath("/");
  revalidatePath("/roadmap");
  void logActivity({ action: "roadmap_node_deleted", entity_type: "roadmap_node", entity_name: (row as { title?: string } | null)?.title });
}

export async function toggleNodePublished(
  id: string,
  is_published: boolean
): Promise<void> {
  const db = createServerSupabaseClient();
  const { error } = await db
    .from("roadmap_nodes")
    .update({ is_published, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/");
  revalidatePath("/roadmap");
}

export async function moveNodeToPhase(nodeId: string, targetPhaseId: string): Promise<void> {
  const db = createServerSupabaseClient();
  const { data: maxOrder } = await db
    .from("roadmap_nodes")
    .select("order_index")
    .eq("phase_id", targetPhaseId)
    .order("order_index", { ascending: false })
    .limit(1)
    .maybeSingle();
  const newOrder = (maxOrder?.order_index ?? -1) + 1;
  const { error } = await db
    .from("roadmap_nodes")
    .update({ phase_id: targetPhaseId, order_index: newOrder, updated_at: new Date().toISOString() })
    .eq("id", nodeId);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/roadmap");
  revalidatePath("/");
  revalidatePath("/roadmap");
}

export interface PublicPhasePreview {
  id: string;
  title: string;
  color: string;
  order_index: number;
  nodes: { title: string }[];
}

export interface RoadmapStats {
  nodeCount: number;
  resourceCount: number;
}

export async function getRoadmapStats(): Promise<RoadmapStats> {
  try {
    const db = createServerSupabaseClient();
    const { data, error } = await db
      .from("roadmap_nodes")
      .select("resources")
      .eq("is_published", true);

    if (error || !data) return { nodeCount: 0, resourceCount: 0 };

    const nodeCount = data.length;
    const resourceCount = data.reduce((sum, n) => {
      const res = n.resources as unknown[];
      return sum + (Array.isArray(res) ? res.length : 0);
    }, 0);

    return { nodeCount, resourceCount };
  } catch {
    return { nodeCount: 0, resourceCount: 0 };
  }
}

export async function getPublicPhasesPreview(): Promise<PublicPhasePreview[]> {
  const db = createServerSupabaseClient();
  const { data, error } = await db
    .from("roadmap_phases")
    .select("id, title, color, order_index, roadmap_nodes(title, order_index, is_published)")
    .order("order_index", { ascending: true });

  if (error) return [];

  return (data ?? [])
    .map((p) => ({
      id: p.id,
      title: p.title,
      color: p.color,
      order_index: p.order_index,
      nodes: (Array.isArray(p.roadmap_nodes) ? p.roadmap_nodes : [])
        .filter((n: { is_published: boolean }) => n.is_published)
        .sort((a: { order_index: number }, b: { order_index: number }) => a.order_index - b.order_index)
        .slice(0, 4)
        .map((n: { title: string }) => ({ title: n.title })),
    }))
    .filter((p) => p.nodes.length > 0);
}

export async function reorderNodes(
  phaseId: string,
  orderedIds: string[]
): Promise<void> {
  const db = createServerSupabaseClient();
  await Promise.all(
    orderedIds.map((id, index) =>
      db
        .from("roadmap_nodes")
        .update({ order_index: index })
        .eq("id", id)
        .eq("phase_id", phaseId)
    )
  );
  revalidatePath("/");
  revalidatePath("/roadmap");
}
