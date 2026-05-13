"use server";

import { createServerSupabaseClient } from "@/lib/supabase";
import { createSessionClient } from "@/lib/supabase-server";

export type ActivityAction =
  | "article_created"
  | "article_updated"
  | "article_published"
  | "article_deleted"
  | "portfolio_created"
  | "portfolio_updated"
  | "portfolio_published"
  | "portfolio_deleted"
  | "roadmap_phase_created"
  | "roadmap_phase_deleted"
  | "roadmap_node_created"
  | "roadmap_node_deleted"
  | "broadcast_created"
  | "broadcast_sent"
  | "broadcast_deleted"
  | "settings_updated"
  | "subscriber_added";

export interface ActivityEntry {
  id: string;
  action: ActivityAction;
  entity_type: string;
  entity_name: string | null;
  details: Record<string, unknown>;
  performed_by: string | null;
  created_at: string;
}

export async function logActivity(entry: {
  action: ActivityAction;
  entity_type: string;
  entity_name?: string | null;
  details?: Record<string, unknown>;
}): Promise<void> {
  try {
    const db = createServerSupabaseClient();

    let performedBy: string | null = null;
    try {
      const session = createSessionClient();
      const { data: { user } } = await session.auth.getUser();
      performedBy = user?.email ?? null;
    } catch {
      // auth not always available (e.g. public API routes)
    }

    await db.from("admin_activity_log").insert({
      action: entry.action,
      entity_type: entry.entity_type,
      entity_name: entry.entity_name ?? null,
      details: entry.details ?? {},
      performed_by: performedBy,
    });
  } catch {
    // Activity logging must never break the calling action
  }
}

export async function getRecentActivity(limit = 15): Promise<ActivityEntry[]> {
  try {
    const db = createServerSupabaseClient();
    const { data, error } = await db
      .from("admin_activity_log")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) return [];
    return (data ?? []) as ActivityEntry[];
  } catch {
    return [];
  }
}
