import "server-only";
import { createClient as createSupabase } from "@supabase/supabase-js";
import { promises as fs } from "fs";
import path from "path";
import { normalizePiece, readingMinutes, slugify } from "./blocks";
import { SEED_AUTHORS, SEED_PIECES } from "./seed";
import { SUPABASE_ANON_KEY, SUPABASE_URL, isSupabaseConfigured } from "./supabase/env";
import { DEFAULT_AUTHOR, MAX_FEATURED, type Author, type InboxItem, type InboxKind, type InboxStatus, type Piece, type PieceStatus, type PieceType } from "./types";

// One place that reads and writes pieces.
// With Supabase connected it uses the database; without it ("local mode") it keeps
// everything in .data/*.json inside the project, so the site, the admin and the MCP
// tools all see the same pieces while you develop.

const COLUMNS =
  "id, type, title, slug, subtitle, category, tags, featured, cover, seo_title, seo_description, reading_minutes, issue_number, author, blocks, access, status, published_at, updated_at";

const DATA_DIR = path.join(process.cwd(), ".data");
const PIECES_FILE = path.join(DATA_DIR, "pieces.json");
const VIEWS_FILE = path.join(DATA_DIR, "views.json");
const AUTHORS_FILE = path.join(DATA_DIR, "authors.json");
const INBOX_FILE = path.join(DATA_DIR, "inbox.json");

function serviceClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!isSupabaseConfigured || !key) return null;
  return createSupabase(SUPABASE_URL, key, { auth: { persistSession: false } });
}
function publicClient() {
  if (!isSupabaseConfigured) return null;
  return createSupabase(SUPABASE_URL, SUPABASE_ANON_KEY, { auth: { persistSession: false } });
}

async function readJson<T>(file: string, fallback: T): Promise<T> {
  try {
    return JSON.parse(await fs.readFile(file, "utf8")) as T;
  } catch {
    return fallback;
  }
}
async function writeJson(file: string, data: unknown) {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(file, JSON.stringify(data, null, 2));
}
async function localPieces(): Promise<Piece[]> {
  const raw = await readJson<Piece[] | null>(PIECES_FILE, null);
  if (raw) {
    // Sample pieces saved before they had covers pick up the new cover.
    return raw.map((p) => {
      const seed = p.id.startsWith("seed-") && !p.cover ? SEED_PIECES.find((x) => x.id === p.id) : undefined;
      return normalizePiece(seed?.cover ? { ...p, cover: seed.cover } : p);
    });
  }
  return SEED_PIECES.map(normalizePiece);
}

function newest(a: Piece, b: Piece) {
  return (b.published_at ?? b.updated_at ?? "").localeCompare(a.published_at ?? a.updated_at ?? "");
}

export type ListQuery = { type?: PieceType; status?: PieceStatus; q?: string; category?: string; featured?: boolean };

function matches(p: Piece, q: ListQuery) {
  if (q.type && p.type !== q.type) return false;
  if (q.status && p.status !== q.status) return false;
  if (q.category && p.category !== q.category) return false;
  if (q.featured !== undefined && p.featured !== q.featured) return false;
  if (q.q) {
    const hay = `${p.title} ${p.subtitle} ${p.category} ${p.tags.join(" ")}`.toLowerCase();
    if (!q.q.toLowerCase().split(/\s+/).every((w) => hay.includes(w))) return false;
  }
  return true;
}

/* Reading -------------------------------------------------------------- */

export async function listPieces(q: ListQuery = {}): Promise<Piece[]> {
  const db = q.status === "published" ? publicClient() ?? serviceClient() : serviceClient();
  if (!isSupabaseConfigured) return (await localPieces()).filter((p) => matches(p, q)).sort(newest);
  if (!db) return [];
  let query = db.from("pieces").select(COLUMNS);
  if (q.type) query = query.eq("type", q.type);
  if (q.status) query = query.eq("status", q.status);
  if (q.category) query = query.eq("category", q.category);
  if (q.featured !== undefined) query = query.eq("featured", q.featured);
  const { data, error } = await query.order("published_at", { ascending: false, nullsFirst: true }).order("updated_at", { ascending: false });
  if (error) {
    console.error("listPieces", error.message);
    return [];
  }
  const rows = (data ?? []).map((r) => normalizePiece(r as Piece));
  return q.q ? rows.filter((p) => matches(p, { q: q.q })) : rows;
}

export async function getPiece(id: string): Promise<Piece | null> {
  if (!isSupabaseConfigured) return (await localPieces()).find((p) => p.id === id) ?? null;
  const db = serviceClient();
  if (!db) return null;
  const { data } = await db.from("pieces").select(COLUMNS).eq("id", id).maybeSingle();
  return data ? normalizePiece(data as Piece) : null;
}

export async function getPublishedBySlug(type: PieceType, slug: string): Promise<Piece | null> {
  if (!isSupabaseConfigured) return (await localPieces()).find((p) => p.type === type && p.slug === slug && p.status === "published") ?? null;
  const db = publicClient();
  if (!db) return null;
  const { data } = await db.from("pieces").select(COLUMNS).eq("type", type).eq("slug", slug).eq("status", "published").maybeSingle();
  return data ? normalizePiece(data as Piece) : null;
}

export async function findPublishedBySlug(slug: string): Promise<Piece | null> {
  const all = await listPieces({ status: "published" });
  return all.find((p) => p.slug === slug) ?? null;
}

/* Writing -------------------------------------------------------------- */

export class FeatureLimitError extends Error {
  constructor(public featured: Piece[]) {
    super(`Only ${MAX_FEATURED} pieces of this type can be featured. Remove one first.`);
  }
}

// Create or update. Reading time is always recalculated; slugs are kept unique per type.
export async function savePiece(input: Piece): Promise<Piece> {
  const p = normalizePiece(input);
  p.slug = slugify(p.slug || p.title) || `piece-${Date.now()}`;
  p.reading_minutes = readingMinutes(p.blocks, p.subtitle);
  if (p.status === "published" && !p.published_at) p.published_at = new Date().toISOString();
  const isNew = !p.id || p.id.startsWith("new");

  // Only published articles, case studies and breakdowns can be featured.
  if (p.status !== "published" || p.type === "newsletter") p.featured = false;
  if (p.featured) {
    const others = (await listPieces({ type: p.type, status: "published", featured: true })).filter((x) => x.id !== p.id);
    if (others.length >= MAX_FEATURED) throw new FeatureLimitError(others);
  }

  if (!isSupabaseConfigured) {
    const all = await localPieces();
    if (all.some((x) => x.type === p.type && x.slug === p.slug && x.id !== p.id)) throw new Error("Another piece already uses this web address. Change it and save again.");
    const saved: Piece = { ...p, id: isNew ? `local-${Date.now()}` : p.id, updated_at: new Date().toISOString() };
    const i = all.findIndex((x) => x.id === p.id);
    if (i >= 0) all[i] = saved;
    else all.unshift(saved);
    await writeJson(PIECES_FILE, all);
    return saved;
  }
  const db = serviceClient();
  if (!db) throw new Error("Add SUPABASE_SERVICE_ROLE_KEY to save pieces.");
  const row = {
    type: p.type,
    title: p.title,
    slug: p.slug,
    subtitle: p.subtitle,
    category: p.category,
    tags: p.tags,
    featured: p.featured,
    cover: p.cover,
    seo_title: p.seo_title,
    seo_description: p.seo_description,
    reading_minutes: p.reading_minutes,
    issue_number: p.issue_number,
    author: p.author || DEFAULT_AUTHOR,
    blocks: p.blocks,
    access: p.access,
    status: p.status,
    published_at: p.published_at,
  };
  const res = isNew || p.id.startsWith("seed-") || p.id.startsWith("local-")
    ? await db.from("pieces").insert(row).select(COLUMNS).single()
    : await db.from("pieces").update(row).eq("id", p.id).select(COLUMNS).single();
  if (res.error) {
    throw new Error(res.error.code === "23505" ? "Another piece already uses this web address. Change it and save again." : res.error.message);
  }
  return normalizePiece(res.data as Piece);
}

export async function deletePiece(id: string): Promise<void> {
  if (!isSupabaseConfigured) {
    await writeJson(PIECES_FILE, (await localPieces()).filter((p) => p.id !== id));
    return;
  }
  const db = serviceClient();
  if (!db) throw new Error("Add SUPABASE_SERVICE_ROLE_KEY to delete pieces.");
  const { error } = await db.from("pieces").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export async function importSamples(): Promise<number> {
  const db = serviceClient();
  if (!db) throw new Error("Connect Supabase first.");
  const rows = SEED_PIECES.map((piece) => {
    const r: Partial<Piece> = { ...normalizePiece(piece) };
    delete r.id;
    delete r.updated_at;
    return r;
  });
  const { error } = await db.from("pieces").upsert(rows, { onConflict: "slug" });
  if (error) throw new Error(error.message);
  return rows.length;
}

/* Views ---------------------------------------------------------------- */

export async function trackView(pieceId: string): Promise<void> {
  if (!isSupabaseConfigured) {
    const views = await readJson<Record<string, Record<string, number>>>(VIEWS_FILE, {});
    const day = new Date().toISOString().slice(0, 10);
    views[pieceId] = views[pieceId] ?? {};
    views[pieceId][day] = (views[pieceId][day] ?? 0) + 1;
    await writeJson(VIEWS_FILE, views);
    return;
  }
  // Counted with the server key; the database function is not open to the public.
  await (serviceClient() ?? publicClient())?.rpc("track_view", { p_piece: pieceId });
}

// Views per piece per day for the last `days` days.
export async function viewsSince(days: number): Promise<{ piece_id: string; day: string; views: number }[]> {
  const since = new Date(Date.now() - days * 864e5).toISOString().slice(0, 10);
  if (!isSupabaseConfigured) {
    const views = await readJson<Record<string, Record<string, number>>>(VIEWS_FILE, {});
    return Object.entries(views).flatMap(([piece_id, byDay]) =>
      Object.entries(byDay).filter(([d]) => d >= since).map(([day, v]) => ({ piece_id, day, views: v })),
    );
  }
  const db = serviceClient();
  if (!db) return [];
  const { data } = await db.from("piece_views").select("piece_id, day, views").gte("day", since);
  return (data ?? []) as { piece_id: string; day: string; views: number }[];
}

export { serviceClient };

/* Authors -------------------------------------------------------------- */

function normalizeAuthor(a: Partial<Author>): Author {
  return {
    slug: slugify(a.slug || a.name || "") || "author",
    name: a.name ?? "",
    role: a.role ?? "",
    short_bio: a.short_bio ?? "",
    bio: a.bio ?? "",
    photo: a.photo ?? "",
    avatar: a.avatar || a.photo || "",
    links: Array.isArray(a.links) ? a.links.filter((l) => l && l.url) : [],
  };
}

export async function listAuthors(): Promise<Author[]> {
  if (!isSupabaseConfigured) return (await readJson<Author[]>(AUTHORS_FILE, SEED_AUTHORS)).map(normalizeAuthor);
  const db = serviceClient() ?? publicClient();
  const { data } = (await db?.from("authors").select("*").order("name")) ?? { data: null };
  return ((data as Author[] | null) ?? SEED_AUTHORS).map(normalizeAuthor);
}

export async function getAuthor(slug: string): Promise<Author | null> {
  return (await listAuthors()).find((a) => a.slug === slug) ?? null;
}

export async function saveAuthor(input: Partial<Author>, previousSlug?: string): Promise<Author> {
  const a = normalizeAuthor(input);
  if (!a.name.trim()) throw new Error("Add a name.");
  for (const l of a.links) if (!/^https?:\/\//i.test(l.url) && !l.url.startsWith("mailto:")) throw new Error(`"${l.url}" isn't a web address. Start it with https://`);
  if (!isSupabaseConfigured) {
    const all = await listAuthors();
    const from = previousSlug ?? a.slug;
    if (a.slug !== from && all.some((x) => x.slug === a.slug)) throw new Error("Another author already uses this web address.");
    const i = all.findIndex((x) => x.slug === from);
    if (i >= 0) all[i] = a;
    else all.push(a);
    await writeJson(AUTHORS_FILE, all);
    if (from !== a.slug) {
      const pieces = await localPieces();
      await writeJson(PIECES_FILE, pieces.map((p) => (p.author === from ? { ...p, author: a.slug } : p)));
    }
    return a;
  }
  const db = serviceClient();
  if (!db) throw new Error("Add SUPABASE_SERVICE_ROLE_KEY to save authors.");
  const res = previousSlug && previousSlug !== a.slug
    ? await db.from("authors").update(a).eq("slug", previousSlug).select("*").single()
    : await db.from("authors").upsert(a, { onConflict: "slug" }).select("*").single();
  if (res.error) throw new Error(res.error.code === "23505" ? "Another author already uses this web address." : res.error.message);
  return normalizeAuthor(res.data as Author);
}

export async function deleteAuthor(slug: string): Promise<void> {
  const used = (await listPieces({})).filter((p) => p.author === slug).length;
  if (used) throw new Error(`This author has ${used} piece${used === 1 ? "" : "s"}. Give them another author first.`);
  if (!isSupabaseConfigured) {
    await writeJson(AUTHORS_FILE, (await listAuthors()).filter((a) => a.slug !== slug));
    return;
  }
  const db = serviceClient();
  if (!db) throw new Error("Add SUPABASE_SERVICE_ROLE_KEY to delete authors.");
  const { error } = await db.from("authors").delete().eq("slug", slug);
  if (error) throw new Error(error.message);
}

/* Inbox ------------------------------------------------------------------ */

export type NewInboxItem = Omit<InboxItem, "id" | "status" | "created_at"> & { ip_hash: string };

export async function addInboxItem(item: NewInboxItem): Promise<void> {
  if (!isSupabaseConfigured) {
    const all = await readJson<(InboxItem & { ip_hash?: string })[]>(INBOX_FILE, []);
    all.unshift({ ...item, id: crypto.randomUUID(), status: "new", created_at: new Date().toISOString() });
    await writeJson(INBOX_FILE, all.slice(0, 5000));
    return;
  }
  const db = serviceClient();
  if (!db) throw new Error("Add SUPABASE_SERVICE_ROLE_KEY to receive messages.");
  const { error } = await db.from("inbox").insert(item);
  if (error) throw new Error(error.message);
}

// How many messages this (hashed) address sent recently. Survives restarts, unlike in-memory limits.
export async function recentInboxCount(ipHash: string, minutes: number): Promise<number> {
  const since = new Date(Date.now() - minutes * 60_000).toISOString();
  if (!isSupabaseConfigured) {
    const all = await readJson<(InboxItem & { ip_hash?: string })[]>(INBOX_FILE, []);
    return all.filter((x) => x.ip_hash === ipHash && x.created_at >= since).length;
  }
  const db = serviceClient();
  if (!db) return 0;
  const { count } = await db.from("inbox").select("id", { count: "exact", head: true }).eq("ip_hash", ipHash).gte("created_at", since);
  return count ?? 0;
}

const INBOX_COLUMNS = "id, kind, status, name, email, phone, subject, message, piece_type, link, consent, created_at";

export async function listInbox(q: { kind?: InboxKind; status?: InboxStatus } = {}): Promise<InboxItem[]> {
  if (!isSupabaseConfigured) {
    const all = await readJson<(InboxItem & { ip_hash?: string })[]>(INBOX_FILE, []);
    return all
      .filter((x) => (!q.kind || x.kind === q.kind) && (!q.status || x.status === q.status))
      .map((x) => {
        const copy = { ...x };
        delete copy.ip_hash;
        return copy;
      });
  }
  const db = serviceClient();
  if (!db) return [];
  let query = db.from("inbox").select(INBOX_COLUMNS).order("created_at", { ascending: false }).limit(500);
  if (q.kind) query = query.eq("kind", q.kind);
  if (q.status) query = query.eq("status", q.status);
  const { data } = await query;
  return (data ?? []) as InboxItem[];
}

export async function setInboxStatus(id: string, status: InboxStatus): Promise<void> {
  if (!isSupabaseConfigured) {
    const all = await readJson<InboxItem[]>(INBOX_FILE, []);
    await writeJson(INBOX_FILE, all.map((x) => (x.id === id ? { ...x, status } : x)));
    return;
  }
  const { error } = (await serviceClient()?.from("inbox").update({ status }).eq("id", id)) ?? { error: null };
  if (error) throw new Error(error.message);
}

export async function deleteInboxItem(id: string): Promise<void> {
  if (!isSupabaseConfigured) {
    const all = await readJson<InboxItem[]>(INBOX_FILE, []);
    await writeJson(INBOX_FILE, all.filter((x) => x.id !== id));
    return;
  }
  const { error } = (await serviceClient()?.from("inbox").delete().eq("id", id)) ?? { error: null };
  if (error) throw new Error(error.message);
}
