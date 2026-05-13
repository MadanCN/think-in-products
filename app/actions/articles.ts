"use server";

import { createServerSupabaseClient } from "@/lib/supabase";
import { revalidatePath } from "next/cache";
import type { ArticleStatus, ArticleDifficulty } from "@/types";
import { logActivity } from "./activity";

export interface AdminArticle {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string | null;
  cover_image: string | null;
  author: string;
  tags: string[];
  difficulty: ArticleDifficulty;
  read_time_minutes: number;
  published_at: string | null;
  status: ArticleStatus;
  is_featured: boolean;
  created_at: string;
  updated_at: string;
}

export type ArticleInput = Omit<AdminArticle, "id" | "created_at" | "updated_at">;

function calcReadTime(content: string | null): number {
  if (!content) return 1;
  const words = content.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

export async function getArticles(): Promise<AdminArticle[]> {
  const db = createServerSupabaseClient();
  const { data, error } = await db
    .from("articles")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as AdminArticle[];
}

export async function getArticle(id: string): Promise<AdminArticle | null> {
  const db = createServerSupabaseClient();
  const { data, error } = await db
    .from("articles")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data as AdminArticle | null;
}

export async function createArticle(input: Partial<ArticleInput>): Promise<AdminArticle> {
  const db = createServerSupabaseClient();
  const payload = {
    title: input.title ?? "Untitled",
    slug: input.slug ?? `untitled-${Date.now()}`,
    excerpt: input.excerpt ?? null,
    content: input.content ?? null,
    cover_image: input.cover_image ?? null,
    author: input.author ?? "Think in Products",
    tags: input.tags ?? [],
    difficulty: input.difficulty ?? "beginner",
    read_time_minutes: calcReadTime(input.content ?? null),
    published_at: input.published_at ?? null,
    status: input.status ?? "draft",
    is_featured: input.is_featured ?? false,
  };
  const { data, error } = await db
    .from("articles")
    .insert(payload)
    .select()
    .single();
  if (error) throw new Error(error.message);
  revalidatePath("/admin/articles");
  revalidatePath("/learn");
  revalidatePath("/");
  void logActivity({ action: "article_created", entity_type: "article", entity_name: (data as AdminArticle).title });
  return data as AdminArticle;
}

export async function updateArticle(
  id: string,
  input: Partial<ArticleInput>
): Promise<AdminArticle> {
  const db = createServerSupabaseClient();
  const updates: Record<string, unknown> = {
    ...input,
    updated_at: new Date().toISOString(),
  };
  if (input.content !== undefined) {
    updates.read_time_minutes = calcReadTime(input.content);
  }
  const { data, error } = await db
    .from("articles")
    .update(updates)
    .eq("id", id)
    .select()
    .single();
  if (error) throw new Error(error.message);
  revalidatePath("/admin/articles");
  revalidatePath("/learn");
  revalidatePath("/");
  const updated = data as AdminArticle;
  revalidatePath(`/learn/${updated.slug}`);
  const action = input.status === "published" ? "article_published" : "article_updated";
  void logActivity({ action, entity_type: "article", entity_name: updated.title });
  return updated;
}

export async function deleteArticle(id: string): Promise<void> {
  const db = createServerSupabaseClient();
  const { data: row } = await db.from("articles").select("title").eq("id", id).maybeSingle();
  const { error } = await db.from("articles").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/articles");
  revalidatePath("/learn");
  void logActivity({ action: "article_deleted", entity_type: "article", entity_name: (row as { title?: string } | null)?.title });
}

export async function toggleArticleFeatured(
  id: string,
  is_featured: boolean
): Promise<void> {
  const db = createServerSupabaseClient();
  const { error } = await db
    .from("articles")
    .update({ is_featured, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/articles");
  revalidatePath("/");
}

// ─── Public read actions ──────────────────────────────────────────────────────

export async function getFeaturedArticles(): Promise<AdminArticle[]> {
  try {
    const db = createServerSupabaseClient();
    const { data, error } = await db
      .from("articles")
      .select("*")
      .eq("status", "published")
      .eq("is_featured", true)
      .order("published_at", { ascending: false })
      .limit(3);
    if (error) return [];
    return (data ?? []) as AdminArticle[];
  } catch {
    return [];
  }
}

export async function getPublishedArticles(opts?: {
  offset?: number;
  limit?: number;
  tag?: string;
}): Promise<{ articles: AdminArticle[]; total: number }> {
  const db = createServerSupabaseClient();
  const offset = opts?.offset ?? 0;
  const limit = opts?.limit ?? 9;

  const base = db
    .from("articles")
    .select("*", { count: "exact" })
    .eq("status", "published")
    .order("published_at", { ascending: false });

  const q = opts?.tag ? base.contains("tags", [opts.tag]) : base;
  const { data, count, error } = await q.range(offset, offset + limit - 1);

  if (error) {
    console.error("[getPublishedArticles]", error.message);
    return { articles: [], total: 0 };
  }
  return { articles: (data ?? []) as AdminArticle[], total: count ?? 0 };
}

export async function getArticleBySlug(slug: string): Promise<AdminArticle | null> {
  const db = createServerSupabaseClient();
  const { data, error } = await db
    .from("articles")
    .select("*")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();
  if (error) {
    console.error("[getArticleBySlug]", error.message);
    return null;
  }
  return data as AdminArticle | null;
}

export async function getRelatedArticles(
  articleId: string,
  tags: string[],
  limit = 2
): Promise<AdminArticle[]> {
  if (!tags.length) return [];
  const db = createServerSupabaseClient();
  const { data, error } = await db
    .from("articles")
    .select("*")
    .eq("status", "published")
    .neq("id", articleId)
    .contains("tags", [tags[0]])
    .order("published_at", { ascending: false })
    .limit(limit);
  if (error || !data?.length) {
    const { data: fallback } = await db
      .from("articles")
      .select("*")
      .eq("status", "published")
      .neq("id", articleId)
      .order("published_at", { ascending: false })
      .limit(limit);
    return (fallback ?? []) as AdminArticle[];
  }
  return data as AdminArticle[];
}

export async function getPublishedArticleSlugs(): Promise<string[]> {
  const db = createServerSupabaseClient();
  const { data } = await db
    .from("articles")
    .select("slug")
    .eq("status", "published");
  return (data ?? []).map((row) => row.slug as string);
}

export async function getAllPublishedTags(): Promise<string[]> {
  const db = createServerSupabaseClient();
  const { data, error } = await db
    .from("articles")
    .select("tags")
    .eq("status", "published");
  if (error) return [];
  const all = (data ?? []).flatMap((row) => (row.tags ?? []) as string[]);
  return Array.from(new Set(all)).sort();
}
