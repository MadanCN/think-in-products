"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { MAX_FEATURED, SECTIONS, pieceUrl, type Piece, type PieceType } from "@/lib/types";
import { ConfirmDialog, FeatureLimitDialog } from "./Dialogs";
import { MiniBars } from "./MiniBars";
import { FeatureLimit, deletePiece, importSamples, listPieces, loadMetrics, savePiece, type Metrics } from "./store";

type Filter = "all" | "published" | "draft" | "featured";
const pct = (v: number) => `${Math.round(v * 100)}%`;

export function SectionList({ type, local }: { type: PieceType; local: boolean }) {
  const s = SECTIONS[type];
  const isNews = type === "newsletter";
  const [pieces, setPieces] = useState<Piece[] | null>(null);
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [error, setError] = useState("");
  const [toDelete, setToDelete] = useState<Piece | null>(null);
  const [limit, setLimit] = useState<{ featured: Piece[]; target: Piece } | null>(null);

  const load = useCallback(() => {
    listPieces({ type }).then(setPieces).catch((e) => setError(e.message));
    loadMetrics().then(setMetrics).catch(() => null);
  }, [type]);
  useEffect(() => {
    load();
  }, [load]);

  const featuredCount = pieces?.filter((p) => p.featured).length ?? 0;
  const shown = useMemo(() => {
    const words = q.toLowerCase().split(/\s+/).filter(Boolean);
    return (pieces ?? []).filter(
      (p) =>
        (filter === "all" || (filter === "featured" ? p.featured : p.status === filter)) &&
        words.every((w) => `${p.title} ${p.subtitle} ${p.category} ${p.tags.join(" ")}`.toLowerCase().includes(w)),
    );
  }, [pieces, q, filter]);

  async function toggleFeature(p: Piece) {
    try {
      await savePiece({ ...p, featured: !p.featured });
      load();
    } catch (e) {
      if (e instanceof FeatureLimit) setLimit({ featured: e.featured, target: p });
      else setError(e instanceof Error ? e.message : "Couldn't change featured");
    }
  }

  const sendFor = (id: string) => metrics?.newsletter.sends.find((x) => x.pieceId === id && x.status === "sent");

  return (
    <main className="admin-page">
      <div className="page-head">
        <div>
          <h1>{isNews ? "Newsletters" : s.plural}</h1>
          <p className="small" style={{ margin: 0 }}>{s.blurb}</p>
        </div>
        <Link href={`${s.adminPath}/new`} className="btn btn-red">{isNews ? "New issue" : `New ${s.label.toLowerCase()}`}</Link>
      </div>

      {isNews && metrics ? (
        <>
          <div className="tiles">
            <div className="tile"><span className="tile-label">Active subscribers</span><span className="tile-value">{metrics.subscribers.active.toLocaleString("en-IN")}</span><span className="tile-note">+{metrics.subscribers.new30} in 30 days</span></div>
            <div className="tile"><span className="tile-label">Waiting to confirm</span><span className="tile-value">{metrics.subscribers.pending}</span></div>
            <div className="tile"><span className="tile-label">Average open rate</span><span className="tile-value">{metrics.newsletter.avgOpenRate === null ? "–" : pct(metrics.newsletter.avgOpenRate)}</span></div>
            <div className="tile"><span className="tile-label">Average click rate</span><span className="tile-value">{metrics.newsletter.avgClickRate === null ? "–" : pct(metrics.newsletter.avgClickRate)}</span></div>
            <div className="tile"><span className="tile-label">Issues sent</span><span className="tile-value">{metrics.newsletter.sends.filter((x) => x.status === "sent").length}</span></div>
          </div>
          <section className="panel" style={{ marginBottom: 24 }}>
            <h3>New confirmed subscribers per day</h3>
            <MiniBars values={metrics.subscribers.byDay} days={metrics.days} label="New subscribers" color="var(--red)" />
            {metrics.local ? <p className="small" style={{ margin: "6px 0 0" }}>Subscriber and email numbers appear once Supabase and Resend are connected.</p> : null}
          </section>
        </>
      ) : null}

      <div className="list-tools">
        <label className="sr-only" htmlFor="list-q">Search</label>
        <input id="list-q" className="field" type="search" placeholder={`Search ${isNews ? "issues" : s.plural.toLowerCase()}`} value={q} onChange={(e) => setQ(e.target.value)} style={{ flex: "1 1 260px", minHeight: 42 }} />
        <div className="seg" role="group" aria-label="Filter">
          {(["all", "published", "draft", ...(isNews ? [] : ["featured"])] as Filter[]).map((f) => (
            <button key={f} type="button" aria-pressed={filter === f} onClick={() => setFilter(f)}>
              {f === "all" ? "All" : f === "draft" ? "Drafts" : f === "published" ? "Published" : `Featured ${featuredCount}/${MAX_FEATURED}`}
            </button>
          ))}
        </div>
      </div>

      {error ? <p style={{ color: "var(--red)" }}>{error}</p> : null}
      {pieces === null ? <p>Loading...</p> : null}

      {pieces && pieces.length === 0 ? (
        <div className="empty">
          <p>Nothing here yet.</p>
          <div className="row">
            <Link href={`${s.adminPath}/new`} className="btn btn-sm btn-dark">{isNews ? "Write the first issue" : `Write the first ${s.label.toLowerCase()}`}</Link>
            {!local ? <button type="button" className="btn btn-sm" onClick={() => importSamples().then(load).catch((e) => setError(e.message))}>Import the 4 sample pieces</button> : null}
          </div>
        </div>
      ) : null}

      {shown.length ? (
        <table className="table list-table">
          <thead>
            <tr>
              <th>Title</th>
              {!isNews ? <th>Category</th> : <th>Issue</th>}
              <th>Status</th>
              {!isNews ? <th>Featured</th> : null}
              <th>Read</th>
              {isNews ? <><th>Sent to</th><th>Opens</th><th>Clicks</th></> : <th>Views (30d)</th>}
              <th>Updated</th>
              <th><span className="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody>
            {shown.map((p) => {
              const send = isNews ? sendFor(p.id) : undefined;
              return (
                <tr key={p.id}>
                  <td className="title-cell"><Link href={`/admin/edit/${p.id}`}>{p.title || "Untitled"}</Link></td>
                  {!isNews ? <td>{p.category || <span className="small">–</span>}</td> : <td>{p.issue_number ? `#${p.issue_number}` : "–"}</td>}
                  <td><span className={`pill${p.status === "published" ? " live" : ""}`}>{p.status === "published" ? "Published" : "Draft"}</span></td>
                  {!isNews ? (
                    <td>
                      <button type="button" className={`star${p.featured ? " on" : ""}`} aria-pressed={p.featured} disabled={p.status !== "published"} aria-label={p.featured ? "Remove from featured" : p.status === "published" ? "Feature" : "Publish before featuring"} title={p.featured ? "Remove from featured" : p.status === "published" ? "Feature" : "Publish before featuring"} onClick={() => toggleFeature(p)}>
                        {p.featured ? "★" : "☆"}
                      </button>
                    </td>
                  ) : null}
                  <td>{p.reading_minutes} min</td>
                  {isNews ? (
                    <>
                      <td>{send ? send.recipients.toLocaleString("en-IN") : <span className="small">Not sent</span>}</td>
                      <td>{send ? pct(send.openRate) : "–"}</td>
                      <td>{send ? pct(send.clickRate) : "–"}</td>
                    </>
                  ) : (
                    <td>{(metrics?.pieceViews[p.id] ?? 0).toLocaleString("en-IN")}</td>
                  )}
                  <td className="small">{p.updated_at ? new Date(p.updated_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : "–"}</td>
                  <td className="actions">
                    {p.status === "published" ? <a href={pieceUrl(p)} target="_blank" rel="noopener">View ↗</a> : null}
                    <button type="button" className="linkbtn" style={{ color: "var(--red)" }} onClick={() => setToDelete(p)}>Delete</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      ) : pieces && pieces.length ? (
        <p className="small" style={{ padding: "20px 0" }}>Nothing matches. <button type="button" className="linkbtn" onClick={() => { setQ(""); setFilter("all"); }}>Clear search</button></p>
      ) : null}

      {toDelete ? (
        <ConfirmDialog
          title="Delete this piece?"
          body={<>&ldquo;{toDelete.title || "Untitled"}&rdquo; will be deleted for good{toDelete.status === "published" ? " and its page will stop working" : ""}. This can&apos;t be undone.</>}
          confirmLabel="Delete"
          danger
          onClose={() => setToDelete(null)}
          onConfirm={async () => {
            await deletePiece(toDelete.id).catch((e) => setError(e.message));
            setToDelete(null);
            load();
          }}
        />
      ) : null}
      {limit ? (
        <FeatureLimitDialog
          featured={limit.featured}
          target={limit.target}
          onClose={() => setLimit(null)}
          onUnfeature={async (p) => {
            await savePiece({ ...p, featured: false });
            const rest = limit.featured.filter((x) => x.id !== p.id);
            try {
              await savePiece({ ...limit.target, featured: true });
              setLimit(null);
            } catch (e) {
              if (e instanceof FeatureLimit) setLimit({ featured: e.featured, target: limit.target });
              else setLimit({ featured: rest, target: limit.target });
            }
            load();
          }}
        />
      ) : null}
    </main>
  );
}
