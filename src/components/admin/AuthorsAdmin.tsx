"use client";

import { useCallback, useEffect, useState } from "react";
import { authorUrl, type Author } from "@/lib/types";
import { AutoText, ImagePicker } from "./BlockEditors";
import { ConfirmDialog } from "./Dialogs";

const blank = (): Author => ({ slug: "", name: "", role: "", short_bio: "", bio: "", photo: "", avatar: "", links: [] });

export function AuthorsAdmin() {
  const [authors, setAuthors] = useState<Author[] | null>(null);
  const [edit, setEdit] = useState<{ author: Author; previousSlug?: string } | null>(null);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState("");
  const [toDelete, setToDelete] = useState<Author | null>(null);

  const load = useCallback(() => {
    fetch("/api/admin/authors", { cache: "no-store" }).then((r) => r.json()).then((d) => setAuthors(d.authors ?? []));
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  async function save() {
    if (!edit) return;
    setError("");
    const res = await fetch("/api/admin/authors", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(edit) });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return setError(data.error ?? "Couldn't save");
    setEdit({ author: data.author, previousSlug: data.author.slug });
    setSaved("Saved");
    setTimeout(() => setSaved(""), 2000);
    load();
  }

  const a = edit?.author;
  const set = (patch: Partial<Author>) => setEdit((e) => (e ? { ...e, author: { ...e.author, ...patch } } : e));

  return (
    <main className="admin-page">
      <div className="page-head">
        <div>
          <h1>Authors</h1>
          <p className="small" style={{ margin: 0 }}>Each author has a page that bylines link to. Author pages aren&apos;t in the site menu.</p>
        </div>
        <button type="button" className="btn btn-red" onClick={() => setEdit({ author: blank() })}>New author</button>
      </div>

      <div className="authors-layout">
        <ul className="author-list">
          {(authors ?? []).map((x) => (
            <li key={x.slug}>
              <button type="button" className={edit?.previousSlug === x.slug ? "on" : undefined} onClick={() => { setError(""); setEdit({ author: x, previousSlug: x.slug }); }}>
                {x.avatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={x.avatar} alt="" width={44} height={44} />
                ) : <span className="avatar-blank" aria-hidden="true">{x.name.slice(0, 1)}</span>}
                <span><strong>{x.name}</strong><span className="small" style={{ display: "block" }}>{x.role}</span></span>
              </button>
            </li>
          ))}
        </ul>

        {a ? (
          <section className="panel stack author-form" aria-label="Edit author">
            <div className="settings-grid" style={{ padding: 0 }}>
              <label><span className="label">Name</span><input className="field" value={a.name} onChange={(e) => set({ name: e.target.value })} /></label>
              <label><span className="label">Web address</span><input className="field" value={a.slug} placeholder="Made from the name" onChange={(e) => set({ slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-") })} /></label>
            </div>
            <label><span className="label">Role (shown under the name)</span><input className="field" value={a.role} placeholder="e.g. Product Manager, healthcare SaaS" onChange={(e) => set({ role: e.target.value })} /></label>
            <label><span className="label">Short bio (bylines and Google, one or two sentences)</span><AutoText value={a.short_bio} minRows={2} onChange={(short_bio) => set({ short_bio })} /></label>
            <label><span className="label">Full bio (author page, Markdown)</span><AutoText value={a.bio} minRows={6} onChange={(bio) => set({ bio })} /></label>
            <div className="settings-grid" style={{ padding: 0 }}>
              <div><span className="label">Photo (author page)</span><ImagePicker src={a.photo} onChange={(photo) => set({ photo })} /></div>
              <div><span className="label">Small round photo (bylines)</span><ImagePicker src={a.avatar} onChange={(avatar) => set({ avatar })} /></div>
            </div>
            <div>
              <span className="label">Links (LinkedIn, X, website)</span>
              <div className="stack" style={{ gap: 8 }}>
                {a.links.map((l, i) => (
                  <div className="row" key={i}>
                    <input className="field" style={{ width: 140 }} value={l.label} placeholder="LinkedIn" aria-label={`Link ${i + 1} label`} onChange={(e) => set({ links: a.links.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)) })} />
                    <input className="field" value={l.url} placeholder="https://" aria-label={`Link ${i + 1} address`} onChange={(e) => set({ links: a.links.map((x, j) => (j === i ? { ...x, url: e.target.value } : x)) })} />
                    <button type="button" className="icon-btn" aria-label="Remove link" onClick={() => set({ links: a.links.filter((_, j) => j !== i) })}>×</button>
                  </div>
                ))}
                <button type="button" className="linkbtn" style={{ alignSelf: "flex-start" }} onClick={() => set({ links: [...a.links, { label: "", url: "" }] })}>+ Add a link</button>
              </div>
            </div>
            {error ? <p className="form-error" role="alert">{error}</p> : null}
            <div className="row" style={{ flexWrap: "wrap" }}>
              <button type="button" className="btn btn-dark" onClick={save}>Save author</button>
              {edit?.previousSlug ? <a className="btn" href={authorUrl(edit.previousSlug)} target="_blank" rel="noopener">View page ↗</a> : null}
              <span className="small" role="status">{saved}</span>
              {edit?.previousSlug ? <button type="button" className="linkbtn" style={{ color: "var(--red)", marginLeft: "auto" }} onClick={() => setToDelete(a)}>Delete author</button> : null}
            </div>
          </section>
        ) : (
          <div className="empty"><p style={{ margin: 0 }}>Pick an author to edit, or add a new one.</p></div>
        )}
      </div>

      {toDelete ? (
        <ConfirmDialog
          title="Delete this author?"
          body={<>{toDelete.name}&apos;s page will stop working. Authors with pieces can&apos;t be deleted until those pieces have another author.</>}
          confirmLabel="Delete"
          danger
          onClose={() => setToDelete(null)}
          onConfirm={async () => {
            const res = await fetch(`/api/admin/authors?slug=${encodeURIComponent(edit?.previousSlug ?? "")}`, { method: "DELETE" });
            const data = await res.json().catch(() => ({}));
            setToDelete(null);
            if (!res.ok) return setError(data.error ?? "Couldn't delete");
            setEdit(null);
            load();
          }}
        />
      ) : null}
    </main>
  );
}
