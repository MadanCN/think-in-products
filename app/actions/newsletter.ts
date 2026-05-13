"use server";

import { createServerSupabaseClient } from "@/lib/supabase";
import { revalidatePath } from "next/cache";
import { logActivity } from "./activity";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AdminSubscriber {
  id: string;
  email: string;
  name: string | null;
  status: "active" | "unsubscribed" | "bounced";
  source: string | null;
  subscribed_at: string;
  unsubscribed_at: string | null;
}

export interface SubscriberStats {
  total: number;
  active: number;
  unsubscribed_this_month: number;
}

export interface AdminBroadcast {
  id: string;
  subject: string;
  preview_text: string | null;
  content: string | null;
  status: "draft" | "sent";
  sent_at: string | null;
  recipient_count: number | null;
  created_at: string;
  updated_at: string;
}

export interface BroadcastEventStats {
  delivered: number;
  bounced: number;
  opened: number;
  clicked: number;
  complained: number;
}

export interface AdminBroadcastWithStats extends AdminBroadcast {
  stats: BroadcastEventStats;
}

// ─── Subscribers ──────────────────────────────────────────────────────────────

export async function getSubscribers(): Promise<AdminSubscriber[]> {
  const db = createServerSupabaseClient();
  const { data, error } = await db
    .from("newsletter_subscribers")
    .select("*")
    .order("subscribed_at", { ascending: false });
  if (error) {
    console.error("[getSubscribers]", error.message);
    return [];
  }
  return (data ?? []) as AdminSubscriber[];
}

export async function getSubscriberStats(): Promise<SubscriberStats> {
  const db = createServerSupabaseClient();

  const startOfMonth = new Date(
    new Date().getFullYear(),
    new Date().getMonth(),
    1
  ).toISOString();

  const [totalRes, activeRes, unsubRes] = await Promise.all([
    db
      .from("newsletter_subscribers")
      .select("id", { count: "exact", head: true }),
    db
      .from("newsletter_subscribers")
      .select("id", { count: "exact", head: true })
      .eq("status", "active"),
    db
      .from("newsletter_subscribers")
      .select("id", { count: "exact", head: true })
      .eq("status", "unsubscribed")
      .gte("unsubscribed_at", startOfMonth),
  ]);

  return {
    total: totalRes.count ?? 0,
    active: activeRes.count ?? 0,
    unsubscribed_this_month: unsubRes.count ?? 0,
  };
}

// ─── Broadcasts ───────────────────────────────────────────────────────────────

export async function getBroadcasts(): Promise<AdminBroadcast[]> {
  const db = createServerSupabaseClient();
  const { data, error } = await db
    .from("broadcasts")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) {
    console.error("[getBroadcasts]", error.message);
    return [];
  }
  return (data ?? []) as AdminBroadcast[];
}

export async function createBroadcast(input: {
  subject?: string;
  preview_text?: string;
  content?: string;
}): Promise<AdminBroadcast> {
  const db = createServerSupabaseClient();
  const { data, error } = await db
    .from("broadcasts")
    .insert({
      subject: input.subject ?? "Untitled Broadcast",
      preview_text: input.preview_text ?? null,
      content: input.content ?? null,
      status: "draft",
      recipient_count: null,
      sent_at: null,
    })
    .select()
    .single();
  if (error) throw new Error(error.message);
  revalidatePath("/admin/newsletter/broadcast");
  void logActivity({ action: "broadcast_created", entity_type: "broadcast", entity_name: (data as AdminBroadcast).subject });
  return data as AdminBroadcast;
}

export async function updateBroadcast(
  id: string,
  input: Partial<{ subject: string; preview_text: string; content: string }>
): Promise<AdminBroadcast> {
  const db = createServerSupabaseClient();
  const { data, error } = await db
    .from("broadcasts")
    .update({ ...input, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();
  if (error) throw new Error(error.message);
  revalidatePath("/admin/newsletter/broadcast");
  return data as AdminBroadcast;
}

export async function deleteBroadcast(id: string): Promise<void> {
  const db = createServerSupabaseClient();
  const { data: row } = await db.from("broadcasts").select("subject").eq("id", id).maybeSingle();
  const { error } = await db.from("broadcasts").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/newsletter/broadcast");
  void logActivity({ action: "broadcast_deleted", entity_type: "broadcast", entity_name: (row as { subject?: string } | null)?.subject });
}

// ─── Welcome email template ───────────────────────────────────────────────────

export interface WelcomeTemplate {
  subject: string;
  content: string;
}

const WELCOME_DEFAULTS: WelcomeTemplate = {
  subject: "Welcome to Think in Products",
  content: `## Welcome aboard! 👋

Thanks for subscribing to Think in Products — really glad to have you here.

Here's what you can expect from this newsletter:
- **PM frameworks** that are actually useful in practice
- **Case study breakdowns** from real products
- **Roadmap updates** as new learning content drops

If you have questions or just want to say hi, reply to this email — I read every message.

Let's build better products together.

— Think in Products`,
};

export async function getWelcomeTemplate(): Promise<WelcomeTemplate> {
  const db = createServerSupabaseClient();
  const { data } = await db
    .from("site_settings")
    .select("value")
    .eq("key", "welcome_email")
    .maybeSingle();

  if (data?.value && typeof data.value === "object") {
    const v = data.value as Record<string, string>;
    return {
      subject: v.subject ?? WELCOME_DEFAULTS.subject,
      content: v.content ?? WELCOME_DEFAULTS.content,
    };
  }
  return WELCOME_DEFAULTS;
}

export async function updateWelcomeTemplate(
  tmpl: WelcomeTemplate
): Promise<void> {
  const db = createServerSupabaseClient();
  const { error } = await db
    .from("site_settings")
    .upsert(
      {
        key: "welcome_email",
        value: tmpl,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "key" }
    );
  if (error) throw new Error(error.message);
}

// ─── Broadcast analytics ──────────────────────────────────────────────────────

const EMPTY_STATS: BroadcastEventStats = {
  delivered: 0, bounced: 0, opened: 0, clicked: 0, complained: 0,
};

export async function getBroadcastsWithStats(): Promise<AdminBroadcastWithStats[]> {
  const db = createServerSupabaseClient();
  const [broadcastsResult, eventsResult] = await Promise.all([
    db.from("broadcasts").select("*").order("created_at", { ascending: false }),
    db.from("broadcast_events").select("broadcast_id, event_type"),
  ]);

  const broadcasts = (broadcastsResult.data ?? []) as AdminBroadcast[];
  const events = eventsResult.data ?? [];

  const statsMap: Record<string, BroadcastEventStats> = {};
  for (const ev of events) {
    if (!statsMap[ev.broadcast_id]) {
      statsMap[ev.broadcast_id] = { ...EMPTY_STATS };
    }
    const key = ev.event_type as keyof BroadcastEventStats;
    if (key in statsMap[ev.broadcast_id]) {
      statsMap[ev.broadcast_id][key]++;
    }
  }

  return broadcasts.map((b) => ({ ...b, stats: statsMap[b.id] ?? { ...EMPTY_STATS } }));
}
