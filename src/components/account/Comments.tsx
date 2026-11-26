"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Avatar } from "./Avatar";

type C = {
  id: string;
  parentId: string | null;
  body: string;
  createdAt: string;
  editedAt: string | null;
  author: { name: string; avatar: string; isAuthor: boolean; authorSlug: string | null };
  mine: boolean;
  likes: number;
  liked: boolean;
  replies: C[];
};
type Viewer = { name: string; avatar: string; blocked: boolean } | null;

function ago(iso: string) {
  const s = (Date.now() - new Date(iso).getTime()) / 1000;
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)} min ago`;
  if (s < 86400) return `${Math.floor(s / 3600)} h ago`;
  if (s < 86400 * 7) return `${Math.floor(s / 86400)} d ago`;
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

const count = (list: C[]) => list.reduce((n, c) => n + 1 + c.replies.length, 0);

async function api(url: string, method: string, body?: unknown) {
  const res = await fetch(url, { method, headers: { "content-type": "application/json" }, body: body ? JSON.stringify(body) : undefined });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error ?? "Something went wrong. Try again.");
  return data;
}

function Composer({ pieceId, parentId, viewer, placeholder, autoFocus, onDone, onCancel, initial, editId }: {
  pieceId: string;
  parentId: string | null;
  viewer: NonNullable<Viewer>;
  placeholder: string;
  autoFocus?: boolean;
  onDone: () => void;
  onCancel?: () => void;
  initial?: string;
  editId?: string;
}) {
  const [text, setText] = useState(initial ?? "");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [hp, setHp] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (text.trim().length < 2) return setErr("Write a little more.");
    setBusy(true);
    setErr("");
    try {
      if (editId) await api(`/api/comments/${editId}`, "PATCH", { body: text });
      else await api("/api/comments", "POST", { pieceId, parentId, body: text, website: hp });
      setText("");
      onDone();
    } catch (e) {
      setErr((e as Error).message);
    }
    setBusy(false);
  }

  return (
    <form onSubmit={submit} className="composer">
      {!editId ? <Avatar name={viewer.name} src={viewer.avatar} size={36} /> : null}
      <div style={{ flex: 1, minWidth: 0 }}>
        <label className="sr-only" htmlFor={`c-${parentId ?? "top"}-${editId ?? "new"}`}>{placeholder}</label>
        <textarea
          id={`c-${parentId ?? "top"}-${editId ?? "new"}`}
          className="field"
          rows={editId || parentId ? 3 : 4}
          maxLength={4000}
          placeholder={placeholder}
          value={text}
          autoFocus={autoFocus}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) void submit(e as unknown as React.FormEvent);
          }}
        />
        <input type="text" name="website" tabIndex={-1} autoComplete="off" value={hp} onChange={(e) => setHp(e.target.value)} className="hp" aria-hidden="true" />
        {err ? <p className="form-error" role="alert">{err}</p> : null}
        <div className="composer-row">
          <span className="small">{text.length > 3500 ? `${4000 - text.length} characters left` : "Be kind, be specific. Ctrl+Enter to post."}</span>
          <span style={{ display: "flex", gap: 8 }}>
            {onCancel ? <button type="button" className="btn btn-sm" onClick={onCancel}>Cancel</button> : null}
            <button type="submit" className="btn btn-sm btn-dark" disabled={busy || text.trim().length < 2}>{busy ? "Posting..." : editId ? "Save" : parentId ? "Reply" : "Post comment"}</button>
          </span>
        </div>
      </div>
    </form>
  );
}

function Comment({ c, pieceId, viewer, reload, signInHref, isReply }: { c: C; pieceId: string; viewer: Viewer; reload: () => void; signInHref: string; isReply?: boolean }) {
  const [replying, setReplying] = useState(false);
  const [editing, setEditing] = useState(false);
  const [liked, setLiked] = useState(c.liked);
  const [likes, setLikes] = useState(c.likes);
  const [err, setErr] = useState("");

  async function like() {
    if (!viewer) return (window.location.href = signInHref);
    setLiked(!liked);
    setLikes(likes + (liked ? -1 : 1));
    try {
      await api(`/api/comments/${c.id}/like`, "POST");
    } catch (e) {
      setLiked(liked);
      setLikes(likes);
      setErr((e as Error).message);
    }
  }
  async function remove() {
    if (!window.confirm(c.replies.length ? "Delete your comment and the replies under it?" : "Delete your comment?")) return;
    try {
      await api(`/api/comments/${c.id}`, "DELETE");
      reload();
    } catch (e) {
      setErr((e as Error).message);
    }
  }

  return (
    <li id={`comment-${c.id}`} className={`comment${isReply ? " reply" : ""}`}>
      <Avatar name={c.author.name} src={c.author.avatar} size={isReply ? 32 : 40} />
      <div className="comment-main">
        <div className="comment-head">
          {c.author.authorSlug ? <Link href={`/authors/${c.author.authorSlug}`}><strong>{c.author.name}</strong></Link> : <strong>{c.author.name}</strong>}
          {c.author.isAuthor ? <span className="badge-author">Author</span> : null}
          {c.mine ? <span className="badge-you">You</span> : null}
          <a href={`#comment-${c.id}`} className="comment-time" title={new Date(c.createdAt).toLocaleString("en-IN")}>{ago(c.createdAt)}</a>
          {c.editedAt ? <span className="comment-time">· edited</span> : null}
        </div>
        {editing && viewer ? (
          <Composer pieceId={pieceId} parentId={c.parentId} viewer={viewer} placeholder="Edit your comment" initial={c.body} editId={c.id} autoFocus onCancel={() => setEditing(false)} onDone={() => { setEditing(false); reload(); }} />
        ) : (
          <p className="comment-body">{c.body}</p>
        )}
        <div className="comment-actions">
          <button type="button" onClick={like} aria-pressed={liked} className={liked ? "on" : undefined}>
            <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill={liked ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round"><path d="M12 21s-7.5-4.6-9.6-9.4C1 8.2 3.2 4.5 6.9 4.5c2.1 0 3.6 1.2 5.1 3 1.5-1.8 3-3 5.1-3 3.7 0 5.9 3.7 4.5 7.1C19.5 16.4 12 21 12 21z" /></svg>
            {likes ? likes : ""} <span className="sr-only">{liked ? "Unlike" : "Like"}</span>
          </button>
          <button type="button" onClick={() => (viewer ? setReplying(!replying) : (window.location.href = signInHref))}>Reply</button>
          {c.mine && !editing ? (
            <>
              <button type="button" onClick={() => setEditing(true)}>Edit</button>
              <button type="button" onClick={remove}>Delete</button>
            </>
          ) : null}
        </div>
        {err ? <p className="form-error" role="alert">{err}</p> : null}
        {replying && viewer ? (
          <Composer pieceId={pieceId} parentId={c.id} viewer={viewer} placeholder={`Reply to ${c.author.name}`} autoFocus onCancel={() => setReplying(false)} onDone={() => { setReplying(false); reload(); }} />
        ) : null}
        {c.replies.length ? (
          <ul className="comment-list">
            {c.replies.map((r) => <Comment key={r.id} c={r} pieceId={pieceId} viewer={viewer} reload={reload} signInHref={signInHref} isReply />)}
          </ul>
        ) : null}
      </div>
    </li>
  );
}

// The discussion under articles, case studies and breakdowns.
export function Comments({ pieceId, pieceUrl }: { pieceId: string; pieceUrl: string }) {
  const [list, setList] = useState<C[] | null>(null);
  const [viewer, setViewer] = useState<Viewer>(null);
  const [sort, setSort] = useState<"newest" | "top" | "oldest">("newest");
  const signInHref = `/login?next=${encodeURIComponent(`${pieceUrl}#comments`)}`;

  const load = useCallback(() => {
    fetch(`/api/comments?piece=${pieceId}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        setList(d.comments ?? []);
        setViewer(d.viewer ?? null);
      })
      .catch(() => setList([]));
  }, [pieceId]);
  useEffect(load, [load]);

  // Jump to a linked comment (from a reply email) once the list is in.
  useEffect(() => {
    if (list && window.location.hash.startsWith("#comment-")) document.getElementById(window.location.hash.slice(1))?.scrollIntoView({ block: "center" });
  }, [list]);

  const sorted = useMemo(() => {
    const l = [...(list ?? [])];
    if (sort === "newest") l.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    if (sort === "top") l.sort((a, b) => b.likes + b.replies.length - (a.likes + a.replies.length));
    return l;
  }, [list, sort]);

  const total = count(list ?? []);

  return (
    <section id="comments" className="wrap comments" aria-labelledby="comments-h">
      <div className="col">
        <div className="comments-head">
          <h2 id="comments-h">Discussion{total ? <span className="comments-count">{total}</span> : null}</h2>
          {total > 1 ? (
            <div className="sort" role="group" aria-label="Sort comments">
              {(["newest", "top", "oldest"] as const).map((s) => (
                <button key={s} type="button" aria-pressed={sort === s} onClick={() => setSort(s)}>{s[0].toUpperCase() + s.slice(1)}</button>
              ))}
            </div>
          ) : null}
        </div>

        {list === null ? (
          <p className="small">Loading the discussion...</p>
        ) : viewer ? (
          viewer.blocked ? (
            <p className="notice-soft">Your account can&apos;t post comments right now. <Link href="/contact">Contact us</Link> if you think that&apos;s a mistake.</p>
          ) : (
            <Composer pieceId={pieceId} parentId={null} viewer={viewer} placeholder={total ? "Add to the discussion" : "Start the discussion. What would you have done?"} onDone={load} />
          )
        ) : (
          <div className="comments-gate">
            <p><strong>Join the discussion.</strong> Share how you&apos;d make the call, ask a question, or push back.</p>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <Link className="btn btn-sm btn-dark" href={signInHref}>Log in to comment</Link>
              <Link className="btn btn-sm" href={`${signInHref}&mode=signup`}>Create a free account</Link>
            </div>
          </div>
        )}

        {list && list.length ? (
          <ul className="comment-list top">
            {sorted.map((c) => <Comment key={c.id} c={c} pieceId={pieceId} viewer={viewer} reload={load} signInHref={signInHref} />)}
          </ul>
        ) : list ? (
          <p className="small" style={{ marginTop: 18 }}>No comments yet. Be the first.</p>
        ) : null}
      </div>
    </section>
  );
}
