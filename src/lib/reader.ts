import "server-only";
import { listAuthors, listPieces, serviceClient } from "./repo";
import { sendWelcome } from "./email/welcome";
import { createClient } from "./supabase/server";
import { pieceUrl, type Piece, type PieceType } from "./types";

// Everything about signed-in readers: who they are, what they've read, and comments.
// Reads and writes go through the server key, after the server has checked who's asking.

export type Reader = {
  id: string;
  email: string;
  name: string;
  avatar: string;
  bio: string;
  notifyReplies: boolean;
  blocked: boolean;
  joined: string;
  provider: string;
};

type ProfileRow = { id: string; name: string | null; avatar_url: string | null; bio?: string; notify_replies?: boolean; comments_blocked?: boolean; created_at: string };

export const displayName = (name: string | null | undefined, email?: string | null) => (name?.trim() || email?.split("@")[0] || "Reader").slice(0, 80);

export async function getReader(): Promise<Reader | null> {
  const supabase = await createClient();
  if (!supabase) return null;
  const { data } = await supabase.auth.getUser();
  const user = data.user;
  if (!user) return null;
  const db = serviceClient();
  const { data: p } = db
    ? await db.from("profiles").select("id, name, avatar_url, bio, notify_replies, comments_blocked, created_at").eq("id", user.id).maybeSingle<ProfileRow>()
    : { data: null };
  const meta = user.user_metadata ?? {};
  return {
    id: user.id,
    email: user.email ?? "",
    name: displayName(p?.name ?? meta.name ?? meta.full_name, user.email),
    avatar: p?.avatar_url || meta.avatar_url || meta.picture || "",
    bio: p?.bio ?? "",
    notifyReplies: p?.notify_replies ?? true,
    blocked: p?.comments_blocked ?? false,
    joined: p?.created_at ?? user.created_at,
    provider: (user.app_metadata?.provider as string) ?? "email",
  };
}

async function profilesById(ids: string[]): Promise<Map<string, ProfileRow>> {
  const db = serviceClient();
  const uniq = [...new Set(ids.filter(Boolean))];
  if (!db || !uniq.length) return new Map();
  const { data } = await db.from("profiles").select("id, name, avatar_url, created_at").in("id", uniq);
  return new Map((data ?? []).map((p) => [p.id, p as ProfileRow]));
}

/* Comments -------------------------------------------------------------- */

export type CommentView = {
  id: string;
  parentId: string | null;
  body: string;
  createdAt: string;
  editedAt: string | null;
  author: { name: string; avatar: string; isAuthor: boolean; authorSlug: string | null };
  mine: boolean;
  likes: number;
  liked: boolean;
  replies: CommentView[];
};

type CommentRow = { id: string; piece_id: string; user_id: string | null; author_slug: string | null; parent_id: string | null; body: string; status: string; seen: boolean; edited_at: string | null; created_at: string };

export async function listComments(pieceId: string, viewerId: string | null): Promise<CommentView[]> {
  const db = serviceClient();
  if (!db) return [];
  const { data } = await db.from("comments").select("*").eq("piece_id", pieceId).eq("status", "visible").order("created_at", { ascending: true }).limit(1000);
  const rows = (data ?? []) as CommentRow[];
  if (!rows.length) return [];
  const ids = rows.map((r) => r.id);
  const [profiles, likes] = await Promise.all([
    profilesById(rows.map((r) => r.user_id ?? "")),
    db.from("comment_likes").select("comment_id, user_id").in("comment_id", ids),
  ]);
  const likeRows = likes.data ?? [];
  const authors = new Map((await listAuthors()).map((a) => [a.slug, a]));
  const views = new Map<string, CommentView>();
  for (const r of rows) {
    const p = r.user_id ? profiles.get(r.user_id) : undefined;
    const a = r.author_slug ? authors.get(r.author_slug) : undefined;
    views.set(r.id, {
      id: r.id,
      parentId: r.parent_id,
      body: r.body,
      createdAt: r.created_at,
      editedAt: r.edited_at,
      author: a
        ? { name: a.name, avatar: a.avatar || a.photo, isAuthor: true, authorSlug: a.slug }
        : { name: displayName(p?.name), avatar: p?.avatar_url ?? "", isAuthor: false, authorSlug: null },
      mine: Boolean(viewerId && r.user_id === viewerId),
      likes: likeRows.filter((l) => l.comment_id === r.id).length,
      liked: Boolean(viewerId && likeRows.some((l) => l.comment_id === r.id && l.user_id === viewerId)),
      replies: [],
    });
  }
  const top: CommentView[] = [];
  for (const v of views.values()) {
    const parent = v.parentId ? views.get(v.parentId) : undefined;
    if (parent) parent.replies.push(v);
    else if (!v.parentId) top.push(v);
  }
  return top;
}

export async function getComment(id: string): Promise<CommentRow | null> {
  const db = serviceClient();
  if (!db) return null;
  const { data } = await db.from("comments").select("*").eq("id", id).maybeSingle();
  return (data as CommentRow) ?? null;
}

export async function countRecentComments(userId: string, minutes: number): Promise<number> {
  const db = serviceClient();
  if (!db) return 0;
  const { count } = await db.from("comments").select("id", { count: "exact", head: true }).eq("user_id", userId).gte("created_at", new Date(Date.now() - minutes * 60_000).toISOString());
  return count ?? 0;
}

export async function insertComment(c: { piece_id: string; user_id?: string | null; author_slug?: string | null; parent_id: string | null; body: string; seen?: boolean }): Promise<CommentRow> {
  const db = serviceClient();
  if (!db) throw new Error("Comments need the database.");
  const { data, error } = await db.from("comments").insert({ ...c, user_id: c.user_id ?? null, author_slug: c.author_slug ?? null, seen: c.seen ?? false }).select("*").single();
  if (error) throw new Error(error.message);
  return data as CommentRow;
}

export async function updateComment(id: string, patch: Partial<Pick<CommentRow, "body" | "status" | "seen" | "edited_at">>) {
  const db = serviceClient();
  if (!db) return;
  const { error } = await db.from("comments").update(patch).eq("id", id);
  if (error) throw new Error(error.message);
}

export async function removeComment(id: string) {
  const db = serviceClient();
  if (!db) return;
  const { error } = await db.from("comments").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export async function toggleLike(commentId: string, userId: string): Promise<boolean> {
  const db = serviceClient();
  if (!db) return false;
  const { data } = await db.from("comment_likes").select("comment_id").eq("comment_id", commentId).eq("user_id", userId).maybeSingle();
  if (data) {
    await db.from("comment_likes").delete().eq("comment_id", commentId).eq("user_id", userId);
    return false;
  }
  await db.from("comment_likes").insert({ comment_id: commentId, user_id: userId });
  return true;
}

// For reply emails: the person being replied to.
export async function commentOwner(userId: string): Promise<{ email: string; name: string; notify: boolean } | null> {
  const db = serviceClient();
  if (!db) return null;
  const [{ data: u }, { data: p }] = await Promise.all([
    db.auth.admin.getUserById(userId),
    db.from("profiles").select("name, notify_replies").eq("id", userId).maybeSingle(),
  ]);
  if (!u?.user?.email) return null;
  return { email: u.user.email, name: displayName(p?.name, u.user.email), notify: p?.notify_replies ?? true };
}

/* Admin view of comments ------------------------------------------------ */

export type AdminComment = {
  id: string;
  pieceId: string;
  pieceTitle: string;
  pieceUrl: string;
  parentId: string | null;
  parentExcerpt: string;
  body: string;
  status: "visible" | "hidden";
  seen: boolean;
  createdAt: string;
  editedAt: string | null;
  likes: number;
  user: { id: string | null; name: string; email: string; avatar: string; blocked: boolean } | null;
  authorSlug: string | null;
};

export async function adminListComments(): Promise<AdminComment[]> {
  const db = serviceClient();
  if (!db) return [];
  const { data } = await db.from("comments").select("*").order("created_at", { ascending: false }).limit(500);
  const rows = (data ?? []) as CommentRow[];
  const userIds = [...new Set(rows.map((r) => r.user_id).filter(Boolean) as string[])];
  const [pieces, profiles, likes, users] = await Promise.all([
    listPieces({}),
    userIds.length ? db.from("profiles").select("id, name, avatar_url, comments_blocked").in("id", userIds) : Promise.resolve({ data: [] }),
    rows.length ? db.from("comment_likes").select("comment_id").in("comment_id", rows.map((r) => r.id)) : Promise.resolve({ data: [] }),
    Promise.all(userIds.map((id) => db.auth.admin.getUserById(id).then((r) => [id, r.data.user?.email ?? ""] as const))),
  ]);
  const byPiece = new Map(pieces.map((p) => [p.id, p]));
  const prof = new Map(((profiles.data ?? []) as { id: string; name: string | null; avatar_url: string | null; comments_blocked: boolean }[]).map((p) => [p.id, p]));
  const emails = new Map(users);
  const byId = new Map(rows.map((r) => [r.id, r]));
  const likeRows = (likes.data ?? []) as { comment_id: string }[];
  return rows.map((r) => {
    const piece = byPiece.get(r.piece_id);
    const p = r.user_id ? prof.get(r.user_id) : undefined;
    const parent = r.parent_id ? byId.get(r.parent_id) : undefined;
    return {
      id: r.id,
      pieceId: r.piece_id,
      pieceTitle: piece?.title ?? "Deleted piece",
      pieceUrl: piece ? pieceUrl(piece) : "/",
      parentId: r.parent_id,
      parentExcerpt: parent ? parent.body.slice(0, 140) : "",
      body: r.body,
      status: r.status as "visible" | "hidden",
      seen: r.seen,
      createdAt: r.created_at,
      editedAt: r.edited_at,
      likes: likeRows.filter((l) => l.comment_id === r.id).length,
      user: r.user_id
        ? { id: r.user_id, name: displayName(p?.name, emails.get(r.user_id)), email: emails.get(r.user_id) ?? "", avatar: p?.avatar_url ?? "", blocked: p?.comments_blocked ?? false }
        : null,
      authorSlug: r.author_slug,
    };
  });
}

export async function unseenCommentCount(): Promise<number> {
  const db = serviceClient();
  if (!db) return 0;
  const { count } = await db.from("comments").select("id", { count: "exact", head: true }).eq("seen", false);
  return count ?? 0;
}

export async function setBlocked(userId: string, blocked: boolean) {
  const db = serviceClient();
  if (!db) return;
  const { error } = await db.from("profiles").update({ comments_blocked: blocked }).eq("id", userId);
  if (error) throw new Error(error.message);
}

/* Reading activity ------------------------------------------------------ */

export type ReadingItem = { piece: Piece; progress: number; completed: boolean; lastReadAt: string; firstReadAt: string };

export async function readingHistory(userId: string): Promise<ReadingItem[]> {
  const db = serviceClient();
  if (!db) return [];
  const [{ data }, pieces] = await Promise.all([
    db.from("reading_progress").select("piece_id, progress, completed, last_read_at, first_read_at").eq("user_id", userId).order("last_read_at", { ascending: false }).limit(200),
    listPieces({ status: "published" }),
  ]);
  const byId = new Map(pieces.map((p) => [p.id, p]));
  return (data ?? []).flatMap((r) => {
    const piece = byId.get(r.piece_id);
    return piece ? [{ piece, progress: r.progress, completed: r.completed, lastReadAt: r.last_read_at, firstReadAt: r.first_read_at }] : [];
  });
}

export async function saveProgress(userId: string, pieceId: string, progress: number) {
  const db = serviceClient();
  if (!db) return;
  const p = Math.max(0, Math.min(100, Math.round(progress)));
  const { data: prev } = await db.from("reading_progress").select("progress, completed").eq("user_id", userId).eq("piece_id", pieceId).maybeSingle();
  const best = Math.max(p, prev?.progress ?? 0);
  await db.from("reading_progress").upsert(
    { user_id: userId, piece_id: pieceId, progress: best, completed: (prev?.completed ?? false) || best >= 90, last_read_at: new Date().toISOString() },
    { onConflict: "user_id,piece_id" },
  );
}

// Pieces you haven't read, ranked by how close they are to what you have.
export async function recommendFor(history: ReadingItem[], count = 6): Promise<Piece[]> {
  const all = (await listPieces({ status: "published" })).filter((p) => p.type !== "newsletter");
  const read = new Set(history.map((h) => h.piece.id));
  const cats = new Map<string, number>();
  const types = new Map<PieceType, number>();
  const tags = new Map<string, number>();
  history.forEach((h, i) => {
    const w = 1 / (1 + i * 0.25); // recent reads count more
    cats.set(h.piece.category, (cats.get(h.piece.category) ?? 0) + w);
    types.set(h.piece.type, (types.get(h.piece.type) ?? 0) + w);
    h.piece.tags.forEach((t) => tags.set(t, (tags.get(t) ?? 0) + w));
  });
  const now = Date.now();
  return all
    .filter((p) => !read.has(p.id))
    .map((p) => {
      const ageDays = p.published_at ? (now - new Date(p.published_at).getTime()) / 864e5 : 365;
      const score =
        3 * (cats.get(p.category) ?? 0) +
        1.5 * (types.get(p.type) ?? 0) +
        p.tags.reduce((n, t) => n + (tags.get(t) ?? 0), 0) +
        (p.featured ? 1 : 0) +
        Math.max(0, 1 - ageDays / 60);
      return { p, score };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, count)
    .map((x) => x.p);
}

export async function readerComments(userId: string): Promise<{ id: string; body: string; createdAt: string; status: string; piece: Piece | null }[]> {
  const db = serviceClient();
  if (!db) return [];
  const [{ data }, pieces] = await Promise.all([
    db.from("comments").select("id, piece_id, body, created_at, status").eq("user_id", userId).order("created_at", { ascending: false }).limit(50),
    listPieces({ status: "published" }),
  ]);
  const byId = new Map(pieces.map((p) => [p.id, p]));
  return (data ?? []).map((c) => ({ id: c.id, body: c.body, createdAt: c.created_at, status: c.status, piece: byId.get(c.piece_id) ?? null }));
}

export async function answerCount(userId: string): Promise<number> {
  const db = serviceClient();
  if (!db) return 0;
  const { count } = await db.from("answers").select("piece_id", { count: "exact", head: true }).eq("user_id", userId);
  return count ?? 0;
}

/* Newsletter opt-in at sign-in ----------------------------------------- */

// Called after Google sign-in or an email confirmation when the "send me the newsletter"
// box was ticked. The address is verified, so it goes straight to active. Anyone who
// unsubscribed before stays unsubscribed: a pre-ticked box shouldn't overrule that.
export async function optInAtSignIn(userId: string, email: string) {
  const db = serviceClient();
  if (!db || !email) return;
  const addr = email.toLowerCase();
  const { data: existing } = await db.from("subscribers").select("id, status").eq("email", addr).maybeSingle();
  if (existing?.status === "active" || existing?.status === "unsubscribed") {
    if (existing.status === "active") await db.from("subscribers").update({ user_id: userId }).eq("id", existing.id);
    return;
  }
  const row = { status: "active", user_id: userId, confirmed_at: new Date().toISOString() };
  if (existing) await db.from("subscribers").update(row).eq("id", existing.id);
  else await db.from("subscribers").insert({ email: addr, source: "sign-in", ...row });
  await sendWelcome(addr).catch(() => null);
}
