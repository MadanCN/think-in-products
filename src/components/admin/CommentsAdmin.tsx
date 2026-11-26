"use client";

/* eslint-disable @next/next/no-img-element */
import { useCallback, useEffect, useMemo, useState } from "react";
import { ConfirmDialog } from "./Dialogs";

type AdminComment = {
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

const when = (iso: string) => new Date(iso).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

async function call(method: string, body?: unknown, query = "") {
  const res = await fetch(`/api/admin/comments${query}`, { method, headers: { "content-type": "application/json" }, body: body ? JSON.stringify(body) : undefined });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error ?? "That didn't work.");
  return data;
}

// Moderate the discussion: read, hide, delete, block, and reply as the author.
export function CommentsAdmin() {
  const [items, setItems] = useState<AdminComment[] | null>(null);
  const [filter, setFilter] = useState<"new" | "all" | "hidden" | "mine">("new");
  const [piece, setPiece] = useState("all");
  const [q, setQ] = useState("");
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [reply, setReply] = useState("");
  const [busy, setBusy] = useState(false);
  const [toDelete, setToDelete] = useState<AdminComment | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(() => {
    call("GET")
      .then((d) => setItems(d.comments ?? []))
      .catch((e) => setError(e.message));
  }, []);
  useEffect(load, [load]);

  const pieces = useMemo(() => [...new Map((items ?? []).map((c) => [c.pieceId, c.pieceTitle])).entries()], [items]);
  const unseen = (items ?? []).filter((c) => !c.seen).length;

  const shown = useMemo(() => {
    const words = q.toLowerCase().split(/\s+/).filter(Boolean);
    return (items ?? []).filter(
      (c) =>
        (filter === "all" ||
          (filter === "new" && !c.seen) ||
          (filter === "hidden" && c.status === "hidden") ||
          (filter === "mine" && c.authorSlug)) &&
        (piece === "all" || c.pieceId === piece) &&
        words.every((w) => `${c.body} ${c.user?.name ?? ""} ${c.user?.email ?? ""} ${c.pieceTitle}`.toLowerCase().includes(w)),
    );
  }, [items, filter, piece, q]);

  async function act(fn: () => Promise<unknown>) {
    setError("");
    try {
      await fn();
      load();
    } catch (e) {
      setError((e as Error).message);
    }
  }

  return (
    <main className="admin-page">
      <div className="page-head">
        <div>
          <h1>Comments</h1>
          <p className="small" style={{ margin: 0 }}>The discussion under articles, case studies and breakdowns. Replies you post here show with an &ldquo;Author&rdquo; badge, and the reader gets an email.</p>
        </div>
        {unseen ? (
          <button type="button" className="btn btn-sm" onClick={() => act(() => call("PATCH", { ids: (items ?? []).filter((c) => !c.seen).map((c) => c.id), seen: true }))}>
            Mark all {unseen} as read
          </button>
        ) : null}
      </div>

      <div className="list-tools">
        <div className="seg" role="group" aria-label="Show">
          <button type="button" aria-pressed={filter === "new"} onClick={() => setFilter("new")}>New{unseen ? ` (${unseen})` : ""}</button>
          <button type="button" aria-pressed={filter === "all"} onClick={() => setFilter("all")}>All</button>
          <button type="button" aria-pressed={filter === "hidden"} onClick={() => setFilter("hidden")}>Hidden</button>
          <button type="button" aria-pressed={filter === "mine"} onClick={() => setFilter("mine")}>Your replies</button>
        </div>
        <label className="sr-only" htmlFor="c-piece">Piece</label>
        <select id="c-piece" className="field" value={piece} onChange={(e) => setPiece(e.target.value)} style={{ flex: "0 1 260px", minHeight: 42 }}>
          <option value="all">All pieces</option>
          {pieces.map(([id, title]) => <option key={id} value={id}>{title}</option>)}
        </select>
        <label className="sr-only" htmlFor="c-q">Search</label>
        <input id="c-q" className="field" type="search" placeholder="Search comments, names, emails" value={q} onChange={(e) => setQ(e.target.value)} style={{ flex: "1 1 220px", minHeight: 42 }} />
      </div>

      {error ? <p style={{ color: "var(--red)" }}>{error}</p> : null}
      {items === null ? <p>Loading...</p> : null}
      {items && !shown.length ? (
        <div className="empty">
          <p style={{ margin: 0 }}>{!items.length ? "No comments yet. They show up here as soon as readers start talking." : filter === "new" ? "You're all caught up." : "Nothing matches."}</p>
        </div>
      ) : null}

      <ul className="inbox-list">
        {shown.map((c) => (
          <li key={c.id} className={`inbox-item${!c.seen ? " unread" : ""}`} style={{ padding: "16px 18px", opacity: c.status === "hidden" ? 0.65 : 1 }}>
            <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
              {c.user?.avatar ? <img src={c.user.avatar} alt="" width={36} height={36} referrerPolicy="no-referrer" style={{ borderRadius: "50%", flex: "0 0 36px" }} /> : <span className="pill" style={{ flex: "0 0 auto" }}>{c.authorSlug ? "You" : "?"}</span>}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="row" style={{ flexWrap: "wrap", gap: "4px 10px", alignItems: "baseline" }}>
                  <strong>{c.authorSlug ? "You (as author)" : c.user?.name}</strong>
                  {c.user?.email ? <a className="small" href={`mailto:${c.user.email}`}>{c.user.email}</a> : null}
                  {c.user?.blocked ? <span className="pill" style={{ background: "var(--red)", color: "#fff" }}>Blocked</span> : null}
                  {c.status === "hidden" ? <span className="pill">Hidden</span> : null}
                  <span className="small">{when(c.createdAt)}{c.editedAt ? " · edited" : ""}{c.likes ? ` · ${c.likes} like${c.likes > 1 ? "s" : ""}` : ""}</span>
                </div>
                <p className="small" style={{ margin: "2px 0 8px" }}>
                  on <a href={`${c.pieceUrl}#comment-${c.id}`} target="_blank" rel="noopener">{c.pieceTitle}</a>
                  {c.parentExcerpt ? <> · replying to &ldquo;{c.parentExcerpt}{c.parentExcerpt.length >= 140 ? "..." : ""}&rdquo;</> : null}
                </p>
                <p className="inbox-message" style={{ margin: "0 0 12px" }}>{c.body}</p>

                {replyTo === c.id ? (
                  <form
                    onSubmit={async (e) => {
                      e.preventDefault();
                      setBusy(true);
                      await act(() => call("POST", { parentId: c.id, body: reply }));
                      setBusy(false);
                      setReply("");
                      setReplyTo(null);
                    }}
                    style={{ marginBottom: 12 }}
                  >
                    <label className="sr-only" htmlFor={`r-${c.id}`}>Your reply</label>
                    <textarea id={`r-${c.id}`} className="field" rows={3} autoFocus value={reply} maxLength={4000} onChange={(e) => setReply(e.target.value)} placeholder={`Reply to ${c.user?.name ?? "this"} as the author`} />
                    <div className="row" style={{ marginTop: 8 }}>
                      <button className="btn btn-sm btn-dark" disabled={busy || !reply.trim()}>{busy ? "Posting..." : "Post reply"}</button>
                      <button type="button" className="btn btn-sm" onClick={() => setReplyTo(null)}>Cancel</button>
                    </div>
                  </form>
                ) : null}

                <div className="row" style={{ flexWrap: "wrap" }}>
                  {replyTo !== c.id ? <button type="button" className="btn btn-sm btn-dark" onClick={() => { setReplyTo(c.id); setReply(""); }}>Reply</button> : null}
                  {!c.seen ? <button type="button" className="btn btn-sm" onClick={() => act(() => call("PATCH", { ids: [c.id], seen: true }))}>Mark read</button> : null}
                  <button type="button" className="btn btn-sm" onClick={() => act(() => call("PATCH", { id: c.id, status: c.status === "hidden" ? "visible" : "hidden" }))}>
                    {c.status === "hidden" ? "Show again" : "Hide"}
                  </button>
                  {c.user?.id ? (
                    <button type="button" className="btn btn-sm" onClick={() => act(() => call("PATCH", { userId: c.user!.id, blocked: !c.user!.blocked }))}>
                      {c.user.blocked ? "Unblock reader" : "Block reader"}
                    </button>
                  ) : null}
                  <button type="button" className="linkbtn" style={{ color: "var(--red)", marginLeft: "auto" }} onClick={() => setToDelete(c)}>Delete</button>
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>

      {toDelete ? (
        <ConfirmDialog
          title="Delete this comment?"
          body={<>It&apos;s removed for good, along with any replies under it. To keep it but take it off the page, use Hide instead.</>}
          confirmLabel="Delete"
          danger
          onClose={() => setToDelete(null)}
          onConfirm={async () => {
            await act(() => call("DELETE", undefined, `?id=${toDelete.id}`));
            setToDelete(null);
          }}
        />
      ) : null}
    </main>
  );
}
