"use server";

import { createServerSupabaseClient } from "@/lib/supabase";
import { revalidatePath } from "next/cache";
import type { MetricItem } from "@/types";
import { logActivity } from "./activity";

export interface AdminCase {
  id: string;
  title: string;
  slug: string;
  company: string | null;
  role: string | null;
  timeline: string | null;
  problem: string | null;
  approach: string | null;
  outcome: string | null;
  learnings: string | null;
  tags: string[];
  figma_url: string | null;
  cover_image_url: string | null;
  metrics: MetricItem[];
  is_featured: boolean;
  status: "draft" | "published";
  order_index: number;
  created_at: string;
  updated_at: string;
}

export type CaseInput = Omit<AdminCase, "id" | "created_at" | "updated_at">;

export async function getAdminCases(): Promise<AdminCase[]> {
  const db = createServerSupabaseClient();
  const { data, error } = await db
    .from("portfolio_cases")
    .select("*")
    .order("order_index", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as AdminCase[];
}

export async function getAdminCase(id: string): Promise<AdminCase | null> {
  const db = createServerSupabaseClient();
  const { data, error } = await db
    .from("portfolio_cases")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data as AdminCase | null;
}

export async function createCase(input: Partial<CaseInput>): Promise<AdminCase> {
  const db = createServerSupabaseClient();
  const { data: max } = await db
    .from("portfolio_cases")
    .select("order_index")
    .order("order_index", { ascending: false })
    .limit(1)
    .maybeSingle();
  const order_index = (max?.order_index ?? -1) + 1;

  const payload = {
    title: input.title ?? "Untitled Case Study",
    slug: input.slug ?? `untitled-${Date.now()}`,
    company: input.company ?? null,
    role: input.role ?? null,
    timeline: input.timeline ?? null,
    problem: input.problem ?? null,
    approach: input.approach ?? null,
    outcome: input.outcome ?? null,
    learnings: input.learnings ?? null,
    tags: input.tags ?? [],
    figma_url: input.figma_url ?? null,
    cover_image_url: input.cover_image_url ?? null,
    metrics: input.metrics ?? [],
    is_featured: input.is_featured ?? false,
    status: input.status ?? "draft",
    order_index,
  };

  const { data, error } = await db
    .from("portfolio_cases")
    .insert(payload)
    .select()
    .single();
  if (error) throw new Error(error.message);
  revalidatePath("/admin/portfolio");
  revalidatePath("/portfolio");
  void logActivity({ action: "portfolio_created", entity_type: "portfolio", entity_name: (data as AdminCase).title });
  return data as AdminCase;
}

export async function updateCase(
  id: string,
  input: Partial<CaseInput>
): Promise<AdminCase> {
  const db = createServerSupabaseClient();
  const { data, error } = await db
    .from("portfolio_cases")
    .update({ ...input, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();
  if (error) throw new Error(error.message);
  revalidatePath("/admin/portfolio");
  revalidatePath("/portfolio");
  const updated = data as AdminCase;
  const action = input.status === "published" ? "portfolio_published" : "portfolio_updated";
  void logActivity({ action, entity_type: "portfolio", entity_name: updated.title });
  return updated;
}

export async function deleteCase(id: string): Promise<void> {
  const db = createServerSupabaseClient();
  const { data: row } = await db.from("portfolio_cases").select("title").eq("id", id).maybeSingle();
  const { error } = await db.from("portfolio_cases").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/portfolio");
  revalidatePath("/portfolio");
  void logActivity({ action: "portfolio_deleted", entity_type: "portfolio", entity_name: (row as { title?: string } | null)?.title });
}

export async function toggleCaseFeatured(
  id: string,
  is_featured: boolean
): Promise<void> {
  const db = createServerSupabaseClient();
  const { error } = await db
    .from("portfolio_cases")
    .update({ is_featured, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/portfolio");
  revalidatePath("/");
}

// ─── Public ───────────────────────────────────────────────────────────────────

export interface PublicCase {
  id: string;
  title: string;
  slug: string;
  company: string | null;
  role: string | null;
  cover_image_url: string | null;
  tags: string[];
  metrics: MetricItem[];
}

export async function getPublicFeaturedCases(): Promise<PublicCase[]> {
  try {
    const db = createServerSupabaseClient();
    const { data, error } = await db
      .from("portfolio_cases")
      .select("id, title, slug, company, role, cover_image_url, tags, metrics")
      .eq("status", "published")
      .eq("is_featured", true)
      .order("order_index", { ascending: true })
      .limit(2);
    if (error) return [];
    return (data ?? []) as PublicCase[];
  } catch {
    return [];
  }
}
