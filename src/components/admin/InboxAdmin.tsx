"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { InboxItem, InboxKind, InboxStatus } from "@/lib/types";
import { ConfirmDialog } from "./Dialogs";

const TYPE_LABEL: Record<string, string> = { article: "Article", case_study: "Case study", breakdown: "Product breakdown" };
const when = (iso: string) => new Date(iso).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

export function InboxAdmin() {
  const [items, setItems] = useState<InboxItem[] | null>(null);
  const [kind, setKind] = useState<InboxKind | "all">("all");
  const [status, setStatus] = useState<InboxStatus | "inbox">("inbox");
  const [q, setQ] = useState("");
  const [open, setOpen] = useState<string | null>(null);
  const [toDelete, setToDelete] = useState<InboxItem | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(() => {
    fetch("/api/admin/inbox", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => setItems(d.items ?? []))
      .catch(() => setError("Couldn't load the inbox."));
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  async function setItemStatus(id: string, s: InboxStatus) {
    setItems((all) => all?.map((x) => (x.id === id ? { ...x, status: s } : x)) ?? null);
    await fetch("/api/admin/inbox", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ id, status: s }) });
  }

  function toggle(item: InboxItem) {
    setOpen(open === item.id ? null : item.id);
    if (item.status === "new") void setItemStatus(item.id, "read");
  }

  const shown = useMemo(() => {
    const words = q.toLowerCase().split(/\s+/).filter(Boolean);
    return (items ?? []).filter(
      (x) =>
        (kind === "all" || x.kind === kind) &&
        (status === "inbox" ? x.status !== "archived" : x.status === status) &&
        words.every((w) => `${x.name} ${x.email} ${x.subject} ${x.message}`.toLowerCase().includes(w)),
    );
  }, [items, kind, status, q]);

  const count = (k: InboxKind) => (items ?? []).filter((x) => x.kind === k && x.status === "new").length;

  return (
    <main className="admin-page">
      <div className="page-head">
        <div>
          <h1>Inbox</h1>
          <p className="small" style={{ margin: 0 }}>Messages from the contact form and pitches from &ldquo;Write for ThinkInProducts&rdquo;.</p>
        </div>
      </div>

      <div className="list-tools">
        <div className="seg" role="group" aria-label="Type">
          <button type="button" aria-pressed={kind === "all"} onClick={() => setKind("all")}>All</button>
          <button type="button" aria-pressed={kind === "contact"} onClick={() => setKind("contact")}>Contact{count("contact") ? ` (${count("contact")})` : ""}</button>
          <button type="button" aria-pressed={kind === "pitch"} onClick={() => setKind("pitch")}>Pitches{count("pitch") ? ` (${count("pitch")})` : ""}</button>
        </div>
        <label className="sr-only" htmlFor="inbox-q">Search</label>
        <input id="inbox-q" className="field" type="search" placeholder="Search names, emails and messages" value={q} onChange={(e) => setQ(e.target.value)} style={{ flex: "1 1 240px", minHeight: 42 }} />
        <div className="seg" role="group" aria-label="Status">
          <button type="button" aria-pressed={status === "inbox"} onClick={() => setStatus("inbox")}>Inbox</button>
          <button type="button" aria-pressed={status === "new"} onClick={() => setStatus("new")}>Unread</button>
          <button type="button" aria-pressed={status === "archived"} onClick={() => setStatus("archived")}>Archived</button>
        </div>
      </div>

      {error ? <p style={{ color: "var(--red)" }}>{error}</p> : null}
      {items === null ? <p>Loading...</p> : null}
      {items && !shown.length ? (
        <div className="empty"><p style={{ margin: 0 }}>{items.length ? "Nothing matches." : "No messages yet. When someone uses the contact form or pitches a piece, it shows up here."}</p></div>
      ) : null}

      <ul className="inbox-list">
        {shown.map((x) => (
          <li key={x.id} className={`inbox-item${x.status === "new" ? " unread" : ""}${open === x.id ? " open" : ""}`}>
            <button type="button" className="inbox-head" aria-expanded={open === x.id} onClick={() => toggle(x)}>
              <span className={`pill${x.kind === "pitch" ? " live" : ""}`}>{x.kind === "pitch" ? "Pitch" : "Contact"}</span>
              <span className="inbox-from">{x.name}</span>
              <span className="inbox-subject">{x.subject || x.message.slice(0, 90)}</span>
              <span className="small inbox-when">{when(x.created_at)}</span>
            </button>
            {open === x.id ? (
              <div className="inbox-body">
                <dl className="inbox-meta">
                  <dt>Email</dt><dd><a href={`mailto:${x.email}`}>{x.email}</a></dd>
                  {x.phone ? (<><dt>Phone</dt><dd><a href={`tel:${x.phone}`}>{x.phone}</a></dd></>) : null}
                  {x.kind === "pitch" ? (
                    <>
                      <dt>Wants to write</dt><dd>{TYPE_LABEL[x.piece_type] ?? (x.piece_type || "Not said")}</dd>
                      {x.subject ? (<><dt>Working title</dt><dd>{x.subject}</dd></>) : null}
                      {x.link ? (<><dt>Earlier writing</dt><dd><a href={x.link} target="_blank" rel="noopener noreferrer nofollow">{x.link}</a></dd></>) : null}
                      <dt>Consent</dt><dd>{x.consent ? "Agreed to be contacted and to the terms" : "No"}</dd>
                    </>
                  ) : x.subject ? (<><dt>Topic</dt><dd>{x.subject}</dd></>) : null}
                  <dt>Received</dt><dd>{new Date(x.created_at).toLocaleString("en-IN")}</dd>
                </dl>
                <p className="inbox-message">{x.message}</p>
                <div className="row" style={{ flexWrap: "wrap" }}>
                  <a className="btn btn-sm btn-dark" href={`mailto:${x.email}?subject=${encodeURIComponent(`Re: ${x.subject || (x.kind === "pitch" ? "your pitch for ThinkInProducts" : "your message")}`)}`}>Reply by email</a>
                  {x.status === "archived" ? (
                    <button type="button" className="btn btn-sm" onClick={() => setItemStatus(x.id, "read")}>Move to inbox</button>
                  ) : (
                    <button type="button" className="btn btn-sm" onClick={() => setItemStatus(x.id, "archived")}>Archive</button>
                  )}
                  <button type="button" className="btn btn-sm" onClick={() => setItemStatus(x.id, "new")}>Mark unread</button>
                  <button type="button" className="linkbtn" style={{ color: "var(--red)", marginLeft: "auto" }} onClick={() => setToDelete(x)}>Delete</button>
                </div>
              </div>
            ) : null}
          </li>
        ))}
      </ul>

      {toDelete ? (
        <ConfirmDialog
          title="Delete this message?"
          body={<>The message from {toDelete.name} will be deleted for good.</>}
          confirmLabel="Delete"
          danger
          onClose={() => setToDelete(null)}
          onConfirm={async () => {
            await fetch(`/api/admin/inbox?id=${encodeURIComponent(toDelete.id)}`, { method: "DELETE" });
            setToDelete(null);
            load();
          }}
        />
      ) : null}
    </main>
  );
}
