import { NextResponse } from "next/server";
import { denyUnlessAdmin } from "@/lib/admin-auth";
import { listInbox, listPieces, serviceClient, viewsSince } from "@/lib/repo";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { unseenCommentCount } from "@/lib/reader";
import type { PieceType } from "@/lib/types";

const DAYS = 30;

function lastDays(n: number) {
  return Array.from({ length: n }, (_, i) => new Date(Date.now() - (n - 1 - i) * 864e5).toISOString().slice(0, 10));
}

// Everything the dashboard and the newsletter section show.
export async function GET(request: Request) {
  const denied = await denyUnlessAdmin(request);
  if (denied) return denied;
  const days = lastDays(DAYS);
  const pieces = await listPieces({});
  const views = await viewsSince(DAYS);
  const byPiece = new Map<string, number>();
  const viewsByDay = new Map<string, number>(days.map((d) => [d, 0]));
  for (const v of views) {
    byPiece.set(v.piece_id, (byPiece.get(v.piece_id) ?? 0) + v.views);
    if (viewsByDay.has(v.day)) viewsByDay.set(v.day, (viewsByDay.get(v.day) ?? 0) + v.views);
  }
  const types: PieceType[] = ["article", "case_study", "breakdown", "newsletter"];
  const content = Object.fromEntries(
    types.map((t) => {
      const ofType = pieces.filter((p) => p.type === t);
      return [t, {
        published: ofType.filter((p) => p.status === "published").length,
        drafts: ofType.filter((p) => p.status === "draft").length,
        featured: ofType.filter((p) => p.featured).length,
        views30: ofType.reduce((n, p) => n + (byPiece.get(p.id) ?? 0), 0),
      }];
    }),
  );
  const topPieces = pieces
    .map((p) => ({ id: p.id, title: p.title, type: p.type, views: byPiece.get(p.id) ?? 0 }))
    .filter((p) => p.views > 0)
    .sort((a, b) => b.views - a.views)
    .slice(0, 8);
  const pieceViews = Object.fromEntries([...byPiece.entries()]);

  const base = {
    local: !isSupabaseConfigured,
    days,
    views: { total30: views.reduce((n, v) => n + v.views, 0), byDay: days.map((d) => viewsByDay.get(d) ?? 0) },
    content,
    topPieces,
    pieceViews,
  };

  const db = serviceClient();
  if (!db) {
    return NextResponse.json({
      inbox: await inboxCounts(),
      comments: { unseen: 0, week: 0 },
      activeReaders7: 0,
      ...base,
      subscribers: { active: 0, pending: 0, unsubscribed: 0, new30: 0, byDay: days.map(() => 0) },
      accounts: { total: 0, plus: 0, pro: 0 },
      newsletter: { sends: [], avgOpenRate: null, avgClickRate: null },
    });
  }

  const since = new Date(Date.now() - DAYS * 864e5).toISOString();
  const [subs, profiles, members, sends] = await Promise.all([
    db.from("subscribers").select("status, created_at, confirmed_at"),
    db.from("profiles").select("id", { count: "exact", head: true }),
    db.from("memberships").select("plan").eq("status", "active"),
    db.from("sends").select("id, piece_id, audience, recipient_count, status, sent_at, created_at").order("created_at", { ascending: false }).limit(50),
  ]);
  const subRows = subs.data ?? [];
  const subsByDay = new Map<string, number>(days.map((d) => [d, 0]));
  for (const s of subRows) {
    const d = (s.confirmed_at ?? "").slice(0, 10);
    if (s.status === "active" && subsByDay.has(d)) subsByDay.set(d, (subsByDay.get(d) ?? 0) + 1);
  }
  const sendRows = sends.data ?? [];
  const ids = sendRows.map((s) => s.id);
  const events = ids.length ? (await db.from("email_events").select("send_id, email, type").in("send_id", ids)).data ?? [] : [];
  const titles = new Map(pieces.map((p) => [p.id, p.title]));
  const sendStats = sendRows.map((s) => {
    const ev = events.filter((e) => e.send_id === s.id);
    const uniq = (t: string) => new Set(ev.filter((e) => e.type === t).map((e) => e.email)).size;
    const delivered = uniq("delivered");
    const opened = uniq("opened");
    const clicked = uniq("clicked");
    const denom = delivered || s.recipient_count || 1;
    return {
      id: s.id,
      pieceId: s.piece_id,
      title: titles.get(s.piece_id) ?? "Deleted issue",
      audience: s.audience,
      status: s.status,
      sentAt: s.sent_at ?? s.created_at,
      recipients: s.recipient_count,
      delivered,
      opened,
      clicked,
      bounced: uniq("bounced"),
      openRate: opened / denom,
      clickRate: clicked / denom,
    };
  });
  const sentOnes = sendStats.filter((s) => s.status === "sent");
  const avg = (k: "openRate" | "clickRate") => (sentOnes.length ? sentOnes.reduce((n, s) => n + s[k], 0) / sentOnes.length : null);

  const since7 = new Date(Date.now() - 7 * 864e5).toISOString();
  const [inbox, unseen, week, readers] = await Promise.all([
    inboxCounts(),
    unseenCommentCount(),
    db.from("comments").select("id", { count: "exact", head: true }).gte("created_at", since7),
    db.from("reading_progress").select("user_id").gte("last_read_at", since7),
  ]);
  return NextResponse.json({
    ...base,
    inbox,
    comments: { unseen, week: week.count ?? 0 },
    activeReaders7: new Set((readers.data ?? []).map((r) => r.user_id)).size,
    subscribers: {
      active: subRows.filter((s) => s.status === "active").length,
      pending: subRows.filter((s) => s.status === "pending").length,
      unsubscribed: subRows.filter((s) => s.status === "unsubscribed").length,
      new30: subRows.filter((s) => s.status === "active" && (s.confirmed_at ?? "") >= since).length,
      byDay: days.map((d) => subsByDay.get(d) ?? 0),
    },
    accounts: {
      total: profiles.count ?? 0,
      plus: (members.data ?? []).filter((m) => m.plan === "plus").length,
      pro: (members.data ?? []).filter((m) => m.plan === "pro").length,
    },
    newsletter: { sends: sendStats, avgOpenRate: avg("openRate"), avgClickRate: avg("clickRate") },
  });
}

async function inboxCounts() {
  const fresh = await listInbox({ status: "new" });
  return { contact: fresh.filter((x) => x.kind === "contact").length, pitch: fresh.filter((x) => x.kind === "pitch").length };
}
