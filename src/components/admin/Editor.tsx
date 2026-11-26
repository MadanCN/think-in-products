"use client";

import "./admin.css";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { PieceView } from "@/components/blocks/PieceView";
import { BLOCK_MENU, autoDescription, newBlock, readingMinutes, slugify } from "@/lib/blocks";
import { SECTIONS, pieceUrl, type Access, type Author, type Block, type BlockType, type Piece } from "@/lib/types";
import { AutoText, BlockEditor, CreditFields, ImagePicker } from "./BlockEditors";
import { ConfirmDialog, FeatureLimitDialog } from "./Dialogs";
import { FeatureLimit, draftKey, savePiece } from "./store";

const LABEL: Record<BlockType, string> = Object.fromEntries(BLOCK_MENU.map((m) => [m.type, m.label])) as Record<BlockType, string>;

/* "+ Add block" menu: type to filter, arrows + Enter to pick, Esc to close. */
function InsertMenu({ onPick, onClose }: { onPick: (t: BlockType) => void; onClose: () => void }) {
  const [q, setQ] = useState("");
  const [hl, setHl] = useState(0);
  const items = BLOCK_MENU.filter((m) => `${m.label} ${m.hint}`.toLowerCase().includes(q.toLowerCase()));
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const away = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener("mousedown", away);
    return () => document.removeEventListener("mousedown", away);
  }, [onClose]);
  return (
    <div className="menu" ref={ref} role="dialog" aria-label="Add a block">
      <input
        className="field"
        autoFocus
        placeholder="Search blocks"
        value={q}
        onChange={(e) => {
          setQ(e.target.value);
          setHl(0);
        }}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") { e.preventDefault(); setHl((h) => Math.min(items.length - 1, h + 1)); }
          if (e.key === "ArrowUp") { e.preventDefault(); setHl((h) => Math.max(0, h - 1)); }
          if (e.key === "Enter" && items[hl]) { e.preventDefault(); onPick(items[hl].type); }
          if (e.key === "Escape") onClose();
        }}
      />
      {items.map((m, i) => {
        const head = i === 0 || items[i - 1].group !== m.group ? <div className="menu-group">{m.group}</div> : null;
        return (
          <div key={m.type}>
            {head}
            <button type="button" className={`menu-item${i === hl ? " hl" : ""}`} onMouseEnter={() => setHl(i)} onClick={() => onPick(m.type)}>
              <b>{m.label}</b>
              <span>{m.hint}</span>
            </button>
          </div>
        );
      })}
      {items.length === 0 ? <p className="small" style={{ padding: 8 }}>No block matches that.</p> : null}
    </div>
  );
}

function Adder({ open, onOpen, onClose, onPick }: { open: boolean; onOpen: () => void; onClose: () => void; onPick: (t: BlockType) => void }) {
  return (
    <div className={`adder${open ? " open" : ""}`}>
      <button type="button" className="adder-btn" aria-label="Add a block here" onClick={onOpen}>+</button>
      {open ? <InsertMenu onPick={onPick} onClose={onClose} /> : null}
    </div>
  );
}

/* Send dialog: test to yourself first, then subscribers. */
function SendDialog({ piece, local, onClose }: { piece: Piece; local: boolean; onClose: () => void }) {
  const [testEmail, setTestEmail] = useState("");
  const [audience, setAudience] = useState<"all" | "free" | "paid">("all");
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  async function go(mode: "test" | "send") {
    setBusy(true);
    setMsg("");
    const res = await fetch("/api/admin/send", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ pieceId: piece.id, mode, testEmail, audience }) });
    const data = await res.json().catch(() => ({}));
    setMsg(res.ok ? (mode === "test" ? `Test sent to ${testEmail}.` : `Sent to ${data.sent} subscribers.`) : data.error ?? "Send failed.");
    setBusy(false);
    setConfirm(false);
  }
  return (
    <div className="modal-back" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" role="dialog" aria-label="Send by email">
        <h2>Send by email</h2>
        {local ? (
          <p>Sending needs Supabase and Resend connected. See the README, then come back here.</p>
        ) : (
          <div className="stack" style={{ gap: 16 }}>
            <p className="small" style={{ margin: 0 }}>Subscribers get the version in the Email tab. Interactive blocks become a link back to the site.</p>
            <div>
              <span className="label">1. Send yourself a test</span>
              <div className="row">
                <input className="field" type="email" placeholder="you@email.com" value={testEmail} onChange={(e) => setTestEmail(e.target.value)} aria-label="Test email address" />
                <button type="button" className="btn btn-sm" disabled={busy || !testEmail} onClick={() => go("test")}>Send test</button>
              </div>
            </div>
            <div>
              <span className="label">2. Send to subscribers</span>
              <div className="row" style={{ flexWrap: "wrap" }}>
                <select className="field" style={{ width: "auto" }} value={audience} onChange={(e) => setAudience(e.target.value as typeof audience)} aria-label="Audience">
                  <option value="all">All newsletter subscribers</option>
                  <option value="free">Free readers only</option>
                  <option value="paid">Paid members only</option>
                </select>
                {piece.status !== "published" ? <span className="small">Publish first.</span> : null}
              </div>
              {confirm ? (
                <div className="row" style={{ marginTop: 10 }}>
                  <span style={{ fontWeight: 700 }}>Send now? This can&apos;t be undone.</span>
                  <button type="button" className="btn btn-sm btn-red" disabled={busy} onClick={() => go("send")}>Yes, send</button>
                  <button type="button" className="btn btn-sm" onClick={() => setConfirm(false)}>Cancel</button>
                </div>
              ) : (
                <button type="button" className="btn btn-sm btn-dark" style={{ marginTop: 10 }} disabled={busy || piece.status !== "published"} onClick={() => setConfirm(true)}>Send to subscribers</button>
              )}
            </div>
          </div>
        )}
        {msg ? <p role="status" style={{ fontWeight: 700, margin: "16px 0 0" }}>{msg}</p> : null}
        <button type="button" className="btn btn-sm" style={{ marginTop: 20 }} onClick={onClose}>Close</button>
      </div>
    </div>
  );
}

function Count({ n, max }: { n: number; max: number }) {
  return <span style={{ fontWeight: 400, color: n > max ? "var(--red)" : "var(--ink-3)" }}>({n}/{max})</span>;
}

export function Editor({ initial, local }: { initial: Piece; local: boolean }) {
  const router = useRouter();
  const [piece, setPiece] = useState<Piece>(initial);
  const [active, setActive] = useState<string | null>(initial.blocks[0]?.id ?? null);
  const [menuAt, setMenuAt] = useState<number | null>(null);
  const [focusId, setFocusId] = useState<string | null>(null);
  const [view, setView] = useState<"web" | "email">("web");
  const [emailHtml, setEmailHtml] = useState("");
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [sendOpen, setSendOpen] = useState(false);
  const [slugTouched, setSlugTouched] = useState(Boolean(initial.slug));
  const [confirm, setConfirm] = useState<"publish" | "unpublish" | null>(null);
  const [limit, setLimit] = useState<Piece[] | null>(null);
  const [toast, setToast] = useState("");
  const [authors, setAuthors] = useState<Author[]>([]);
  useEffect(() => {
    fetch("/api/admin/authors", { cache: "no-store" }).then((r) => r.json()).then((d) => setAuthors(d.authors ?? [])).catch(() => null);
  }, []);
  const section = SECTIONS[piece.type];
  const isNews = piece.type === "newsletter";
  const minutes = useMemo(() => readingMinutes(piece.blocks, piece.subtitle), [piece.blocks, piece.subtitle]);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 2600);
    return () => clearTimeout(t);
  }, [toast]);
  const previewRef = useRef<HTMLDivElement>(null);
  const writeRef = useRef<HTMLDivElement>(null);

  const update = useCallback((patch: Partial<Piece>) => {
    setPiece((p) => ({ ...p, ...patch }));
    setDirty(true);
  }, []);
  const updateBlock = useCallback((id: string, patch: Partial<Block>) => {
    setPiece((p) => ({ ...p, blocks: p.blocks.map((b) => (b.id === id ? ({ ...b, ...patch } as Block) : b)) }));
    setDirty(true);
  }, []);

  // Keep a copy of the draft for the full-page preview tab and in case the browser closes.
  useEffect(() => {
    const t = setTimeout(() => {
      try {
        localStorage.setItem(draftKey(piece.id), JSON.stringify(piece));
      } catch {}
    }, 250);
    return () => clearTimeout(t);
  }, [piece]);

  // Email tab: render the email version from the current draft.
  useEffect(() => {
    if (view !== "email") return;
    const t = setTimeout(async () => {
      const res = await fetch("/api/admin/email-preview", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(piece) });
      if (res.ok) setEmailHtml((await res.json()).html);
    }, 500);
    return () => clearTimeout(t);
  }, [piece, view]);

  const save = useCallback(
    async (patch: Partial<Piece> = {}, done?: string): Promise<boolean> => {
      setSaving(true);
      setError("");
      try {
        const next = { ...piece, ...patch, slug: piece.slug || slugify(piece.title) || `piece-${Date.now()}` };
        const saved = await savePiece(next);
        setPiece(saved);
        setDirty(false);
        setSavedAt(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
        if (done) setToast(done);
        try {
          localStorage.removeItem(draftKey(piece.id));
          localStorage.setItem(draftKey(saved.id), JSON.stringify(saved));
        } catch {}
        if (saved.id !== piece.id) router.replace(`/admin/edit/${saved.id}`);
        setSaving(false);
        return true;
      } catch (e) {
        if (e instanceof FeatureLimit) setLimit(e.featured);
        else setError(e instanceof Error ? e.message : "Couldn't save");
        setSaving(false);
        return false;
      }
    },
    [piece, router],
  );

  // Ctrl/Cmd + S saves.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        void save();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [save]);

  // Warn before leaving with unsaved changes.
  useEffect(() => {
    const onLeave = (e: BeforeUnloadEvent) => {
      if (dirty) e.preventDefault();
    };
    window.addEventListener("beforeunload", onLeave);
    return () => window.removeEventListener("beforeunload", onLeave);
  }, [dirty]);

  // Writing a block scrolls the preview to it.
  useEffect(() => {
    if (!active || view !== "web") return;
    const el = previewRef.current?.querySelector(`[id="${active}"]`);
    el?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [active, view]);

  function insert(at: number, type: BlockType, replaceId?: string) {
    const b = newBlock(type);
    setPiece((p) => {
      const blocks = [...p.blocks];
      if (replaceId) {
        const i = blocks.findIndex((x) => x.id === replaceId);
        blocks.splice(i, 1, b);
      } else blocks.splice(at, 0, b);
      return { ...p, blocks };
    });
    setDirty(true);
    setActive(b.id);
    setFocusId(b.id);
    setMenuAt(null);
    setSlashFor(null);
  }
  const [slashFor, setSlashFor] = useState<string | null>(null);

  function move(id: string, dir: -1 | 1) {
    setPiece((p) => {
      const i = p.blocks.findIndex((b) => b.id === id);
      const j = i + dir;
      if (j < 0 || j >= p.blocks.length) return p;
      const blocks = [...p.blocks];
      [blocks[i], blocks[j]] = [blocks[j], blocks[i]];
      return { ...p, blocks };
    });
    setDirty(true);
  }
  function duplicate(id: string) {
    setPiece((p) => {
      const i = p.blocks.findIndex((b) => b.id === id);
      const copy = { ...structuredClone(p.blocks[i]), id: `b_${Math.random().toString(36).slice(2, 9)}` };
      const blocks = [...p.blocks];
      blocks.splice(i + 1, 0, copy);
      return { ...p, blocks };
    });
    setDirty(true);
  }
  function remove(id: string) {
    setPiece((p) => ({ ...p, blocks: p.blocks.filter((b) => b.id !== id) }));
    setDirty(true);
  }

  // Clicking a block in the preview jumps to it in the writing space.
  function onPreviewClick(e: React.MouseEvent) {
    const el = (e.target as HTMLElement).closest(".block");
    if (!el?.id) return;
    setActive(el.id);
    writeRef.current?.querySelector(`[data-block="${el.id}"]`)?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  const previewPiece = useMemo(() => ({ ...piece, reading_minutes: minutes }), [piece, minutes]);
  const seoTitle = piece.seo_title || piece.title || "Title";
  const seoDesc = piece.seo_description || autoDescription(piece);
  const tbtn = { minHeight: 36 };

  return (
    <div className="admin editor">
      <div className="admin-top">
        <Link href={section.adminPath} className="btn btn-sm" style={tbtn}>← {isNews ? "Newsletters" : section.plural}</Link>
        <span className={`pill${piece.status === "published" ? " live" : ""}`}>{piece.status === "published" ? "Published" : "Draft"}</span>
        <span className="pill" title="Worked out from the words and visuals">{minutes} min read</span>
        <span className="save-state" role="status">
          {saving ? "Saving..." : error ? <span style={{ color: "var(--red)" }}>{error}</span> : dirty ? "Unsaved changes" : savedAt ? `Saved at ${savedAt}` : ""}
        </span>
        <span className="spacer" />
        {!isNews ? (
          <button type="button" className={`btn btn-sm feat-btn${piece.featured ? " on" : ""}`} style={tbtn} aria-pressed={piece.featured} disabled={saving || piece.status !== "published"} title={piece.status !== "published" ? "Publish before featuring" : undefined} onClick={() => save({ featured: !piece.featured }, piece.featured ? "Removed from featured" : "Featured")}>
            {piece.featured ? "★ Featured" : "☆ Feature"}
          </button>
        ) : null}
        <button type="button" className="btn btn-sm" style={tbtn} disabled={saving} onClick={() => save({}, "Draft saved")}>{piece.status === "published" ? "Save changes" : "Save draft"}</button>
        {piece.status === "published" ? (
          <>
            <a className="btn btn-sm" style={tbtn} href={pieceUrl(piece)} target="_blank" rel="noopener">View live ↗</a>
            <button type="button" className="btn btn-sm" style={tbtn} disabled={saving} onClick={() => setConfirm("unpublish")}>Unpublish</button>
          </>
        ) : (
          <button type="button" className="btn btn-sm btn-dark" style={tbtn} disabled={saving || !piece.title.trim()} onClick={() => setConfirm("publish")}>Publish</button>
        )}
        {isNews ? <button type="button" className="btn btn-sm btn-red" style={tbtn} onClick={() => setSendOpen(true)}>Send by email</button> : null}
      </div>

      <div className="split">
        {/* Writing space */}
        <div className="write-pane" ref={writeRef}>
          <div className="type-flag"><span className="tag" style={{ background: section.color }}>{isNews ? `Newsletter${piece.issue_number ? `, issue ${piece.issue_number}` : ""}` : section.label}</span></div>
          <AutoText className="title-input" value={piece.title} placeholder="Title" ariaLabel="Title" onChange={(title) => update(slugTouched ? { title } : { title, slug: slugify(title) })} />
          <AutoText className="sub-input" value={piece.subtitle} placeholder="One line under the title: what will the reader get?" ariaLabel="Subtitle" onChange={(subtitle) => update({ subtitle })} />

          <details className="settings">
            <summary>
              {!isNews ? <span className="tag" style={{ fontSize: 12 }}>{piece.category || "No category"}</span> : null}
              <span className="tag" style={{ fontSize: 12 }}>{piece.access === "free" ? "Free" : piece.access === "plus" ? "Plus" : "Pro"}</span>
              <span className="small" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{section.path}/{piece.slug || "..."}</span>
              <span style={{ marginLeft: "auto" }} className="small">Settings, cover and Google</span>
            </summary>
            <div className="settings-body">
              <div className="settings-grid">
                {!isNews ? (
                  <label><span className="label">Category</span>
                    <select className="field" value={piece.category} onChange={(e) => update({ category: e.target.value })}>
                      <option value="">Choose one</option>
                      {section.categories.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </label>
                ) : (
                  <label><span className="label">Issue number</span>
                    <input className="field" type="number" min={1} value={piece.issue_number ?? ""} onChange={(e) => update({ issue_number: e.target.value ? Number(e.target.value) : null })} />
                  </label>
                )}
                <label><span className="label">Who can read it</span>
                  <select className="field" value={piece.access} onChange={(e) => update({ access: e.target.value as Access })}>
                    <option value="free">Everyone (free)</option>
                    <option value="plus">Plus and Pro</option>
                    <option value="pro">Pro only</option>
                  </select>
                </label>
                <label><span className="label">Author</span>
                  <select className="field" value={piece.author} onChange={(e) => update({ author: e.target.value })}>
                    {authors.length ? null : <option value={piece.author}>{piece.author}</option>}
                    {authors.map((a) => <option key={a.slug} value={a.slug}>{a.name}</option>)}
                  </select>
                </label>
                <label><span className="label">Web address</span>
                  <input className="field" value={piece.slug} onChange={(e) => { setSlugTouched(true); update({ slug: slugify(e.target.value) }); }} />
                </label>
              </div>
              <label style={{ display: "block" }}><span className="label">Tags (comma separated, used by search)</span>
                <input className="field" value={piece.tags.join(", ")} placeholder="e.g. strategy, pricing, netflix" onChange={(e) => update({ tags: e.target.value.split(",").map((t) => t.trim()).filter(Boolean) })} />
              </label>

              <div>
                <span className="label">Cover image (shown at the top and on cards)</span>
                {piece.cover ? (
                  <div className="stack">
                    <ImagePicker src={piece.cover.src} onChange={(src) => update({ cover: { ...piece.cover!, src } })} />
                    <input className="field" value={piece.cover.alt} placeholder="Describe the image for screen readers" aria-label="Cover description" onChange={(e) => update({ cover: { ...piece.cover!, alt: e.target.value } })} />
                    <CreditFields credit={piece.cover.credit} creditUrl={piece.cover.creditUrl} onChange={(c) => update({ cover: { ...piece.cover!, ...c } })} />
                    <button type="button" className="linkbtn" style={{ alignSelf: "flex-start", color: "var(--red)" }} onClick={() => update({ cover: null })}>Remove cover</button>
                  </div>
                ) : (
                  <button type="button" className="btn btn-sm" onClick={() => update({ cover: { src: "", alt: "", credit: "", creditUrl: "" } })}>Add a cover image</button>
                )}
              </div>

              <div>
                <span className="label">How it shows on Google</span>
                <div className="serp" aria-hidden="true">
                  <span className="serp-url">thinkinproducts.com › {section.path.slice(1)} › {piece.slug || "..."}</span>
                  <span className="serp-title">{seoTitle.length > 60 ? `${seoTitle.slice(0, 58)}...` : seoTitle}</span>
                  <span className="serp-desc">{seoDesc.length > 160 ? `${seoDesc.slice(0, 157)}...` : seoDesc}</span>
                </div>
                <label style={{ display: "block", marginTop: 10 }}>
                  <span className="label">Search title <Count n={piece.seo_title.length} max={60} /></span>
                  <input className="field" value={piece.seo_title} placeholder={piece.title || "Uses the title if empty"} onChange={(e) => update({ seo_title: e.target.value })} />
                </label>
                <label style={{ display: "block", marginTop: 10 }}>
                  <span className="label">Search description <Count n={piece.seo_description.length} max={160} /></span>
                  <AutoText value={piece.seo_description} minRows={2} placeholder="Uses the subtitle if empty. Aim for 140 to 160 characters." onChange={(seo_description) => update({ seo_description })} />
                </label>
              </div>
            </div>
          </details>

          <div style={{ marginTop: 18 }}>
            <Adder open={menuAt === 0} onOpen={() => setMenuAt(0)} onClose={() => setMenuAt(null)} onPick={(t) => insert(0, t)} />
            {piece.blocks.map((b, i) => (
              <div key={b.id}>
                <div
                  data-block={b.id}
                  className={`bcard${active === b.id ? " is-active" : ""}`}
                  onFocusCapture={() => setActive(b.id)}
                  onMouseDown={() => setActive(b.id)}
                >
                  <div className="bcard-head">
                    <span className="bcard-type">{LABEL[b.type]}</span>
                    <div className="bcard-tools">
                      <button type="button" className="icon-btn" aria-label="Move up" disabled={i === 0} onClick={() => move(b.id, -1)}>↑</button>
                      <button type="button" className="icon-btn" aria-label="Move down" disabled={i === piece.blocks.length - 1} onClick={() => move(b.id, 1)}>↓</button>
                      <button type="button" className="icon-btn" aria-label="Duplicate" onClick={() => duplicate(b.id)}>⧉</button>
                      <button type="button" className="icon-btn" aria-label="Delete block" onClick={() => remove(b.id)}>✕</button>
                    </div>
                  </div>
                  {slashFor === b.id ? (
                    <div style={{ position: "relative", height: 30 }}>
                      <InsertMenu onPick={(t) => insert(i, t, b.id)} onClose={() => setSlashFor(null)} />
                    </div>
                  ) : null}
                  <BlockEditor
                    block={b}
                    local={local}
                    autoFocus={focusId === b.id}
                    onChange={(patch) => updateBlock(b.id, patch)}
                    onSlash={() => setSlashFor(b.id)}
                  />
                </div>
                <Adder open={menuAt === i + 1} onOpen={() => setMenuAt(i + 1)} onClose={() => setMenuAt(null)} onPick={(t) => insert(i + 1, t)} />
              </div>
            ))}
            {piece.blocks.length === 0 ? (
              <button type="button" className="add-big" onClick={() => insert(0, "text")}>Start writing</button>
            ) : (
              <button type="button" className="add-big" onClick={() => setMenuAt(piece.blocks.length)}>+ Add a block</button>
            )}
          </div>
        </div>

        {/* Preview: the same components the live site uses */}
        <div className="preview-pane">
          <div className="preview-bar">
            {isNews ? (
              <div className="seg" role="group" aria-label="Preview as">
                <button type="button" aria-pressed={view === "web"} onClick={() => setView("web")}>Website</button>
                <button type="button" aria-pressed={view === "email"} onClick={() => setView("email")}>Email</button>
              </div>
            ) : <strong style={{ fontSize: 14 }}>Preview</strong>}
            <span className="small" style={{ marginLeft: 6 }}>{view === "web" ? "Click any part to jump to it" : "What subscribers get in their inbox"}</span>
            <span style={{ flex: 1 }} />
            <a className="btn btn-sm" style={{ minHeight: 34 }} href={`/admin/preview?id=${encodeURIComponent(piece.id)}`} target="_blank" rel="noopener">Open full page ↗</a>
          </div>
          {view === "web" || !isNews ? (
            <div className="preview-scroll" ref={previewRef} onClick={onPreviewClick}>
              <style>{`.preview-scroll [id="${active}"].block{outline-color:var(--blue)}`}</style>
              <PieceView piece={previewPiece} author={authors.find((a) => a.slug === piece.author) ?? null} />
            </div>
          ) : (
            <div className="preview-scroll" style={{ background: "var(--pad)" }}>
              {emailHtml ? <iframe className="email-frame" title="Email preview" srcDoc={emailHtml} sandbox="" /> : <p style={{ padding: 24 }}>Rendering the email...</p>}
            </div>
          )}
        </div>
      </div>
      {sendOpen && isNews ? <SendDialog piece={piece} local={local} onClose={() => setSendOpen(false)} /> : null}
      {confirm === "publish" ? (
        <ConfirmDialog
          title={isNews ? "Publish this issue?" : `Publish this ${section.label.toLowerCase()}?`}
          body={
            <>
              <p style={{ margin: "0 0 8px" }}>&ldquo;{piece.title}&rdquo; goes live at <strong>{section.path}/{piece.slug || slugify(piece.title)}</strong> and is added to the sitemap for Google.</p>
              {!piece.category && !isNews ? <p style={{ margin: 0, color: "var(--red)" }}>It has no category yet, so it only shows under &ldquo;Everything&rdquo;.</p> : null}
              {isNews ? <p style={{ margin: 0 }}>Publishing doesn&apos;t email anyone. Use &ldquo;Send by email&rdquo; when you&apos;re ready.</p> : null}
            </>
          }
          confirmLabel="Publish"
          onClose={() => setConfirm(null)}
          onConfirm={async () => {
            if (await save({ status: "published", published_at: piece.published_at ?? new Date().toISOString() }, "Published")) setConfirm(null);
            else setConfirm(null);
          }}
        />
      ) : null}
      {confirm === "unpublish" ? (
        <ConfirmDialog
          title="Unpublish?"
          body={<>&ldquo;{piece.title}&rdquo; goes back to drafts. Its page stops working and it leaves the site{piece.featured ? " and featured" : ""} until you publish it again.</>}
          confirmLabel="Unpublish"
          danger
          onClose={() => setConfirm(null)}
          onConfirm={async () => {
            await save({ status: "draft", featured: false }, "Unpublished");
            setConfirm(null);
          }}
        />
      ) : null}
      {limit ? (
        <FeatureLimitDialog
          featured={limit}
          target={piece}
          onClose={() => setLimit(null)}
          onUnfeature={async (p) => {
            await savePiece({ ...p, featured: false });
            setLimit(null);
            await save({ featured: true }, "Featured");
          }}
        />
      ) : null}
      {toast ? <div className="toast" role="status">{toast}</div> : null}
    </div>
  );
}
