"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { MAX_FEATURED, SECTIONS, SECTION_LIST, type PieceType } from "@/lib/types";
import { MiniBars } from "./MiniBars";
import { loadMetrics, type Metrics } from "./store";

const pct = (v: number | null) => (v === null ? "–" : `${Math.round(v * 100)}%`);

function Tile({ label, value, note, href }: { label: string; value: string | number; note?: string; href?: string }) {
  const body = (
    <>
      <span className="tile-label">{label}</span>
      <span className="tile-value">{typeof value === "number" ? value.toLocaleString("en-IN") : value}</span>
      {note ? <span className="tile-note">{note}</span> : null}
    </>
  );
  return href ? <Link href={href} className="tile">{body}</Link> : <div className="tile">{body}</div>;
}

export function Dashboard() {
  const [m, setM] = useState<Metrics | null>(null);
  const [err, setErr] = useState("");
  useEffect(() => {
    loadMetrics().then(setM).catch((e) => setErr(e.message));
  }, []);
  if (err) return <main className="admin-page"><p style={{ color: "var(--red)" }}>{err}</p></main>;
  if (!m) return <main className="admin-page"><p>Loading the numbers...</p></main>;

  const published = SECTION_LIST.reduce((n, s) => n + m.content[s.type].published, 0);
  const lastSend = m.newsletter.sends.find((s) => s.status === "sent");
  return (
    <main className="admin-page">
      <div className="page-head">
        <div>
          <h1>Dashboard</h1>
          <p className="small" style={{ margin: 0 }}>Last 30 days unless it says otherwise.</p>
        </div>
        <div className="row" style={{ flexWrap: "wrap" }}>
          {SECTION_LIST.map((s) => <Link key={s.type} href={`${s.adminPath}/new`} className="btn btn-sm">New {s.type === "newsletter" ? "issue" : s.label.toLowerCase()}</Link>)}
        </div>
      </div>

      {m.local ? (
        <div className="notice">
          <strong>Local mode.</strong> Pieces and page views are saved in this project&apos;s .data folder. Subscriber, account and email numbers appear once Supabase and Resend are connected (see the README).
        </div>
      ) : null}

      <h2 className="admin-h2">Readers</h2>
      <div className="tiles">
        <Tile label="Active subscribers" value={m.subscribers.active} note={`+${m.subscribers.new30} in 30 days`} href="/admin/newsletters" />
        <Tile label="Waiting to confirm" value={m.subscribers.pending} note="Signed up, link not clicked yet" />
        <Tile label="Unsubscribed" value={m.subscribers.unsubscribed} />
        <Tile label="Accounts" value={m.accounts.total} />
        <Tile label="Paid members" value={m.accounts.plus + m.accounts.pro} note={`${m.accounts.plus} Plus, ${m.accounts.pro} Pro`} />
        <Tile label="Unread messages" value={(m.inbox?.contact ?? 0) + (m.inbox?.pitch ?? 0)} note={`${m.inbox?.contact ?? 0} contact, ${m.inbox?.pitch ?? 0} pitches`} href="/admin/inbox" />
        <Tile label="New comments" value={m.comments?.unseen ?? 0} note={`${m.comments?.week ?? 0} in the last 7 days`} href="/admin/comments" />
        <Tile label="Readers this week" value={m.activeReaders7 ?? 0} note="Signed in and read something" />
      </div>
      <div className="panels">
        <section className="panel">
          <h3>New confirmed subscribers per day</h3>
          <MiniBars values={m.subscribers.byDay} days={m.days} label="New subscribers" color="var(--red)" />
        </section>
        <section className="panel">
          <h3>Page views per day</h3>
          <MiniBars values={m.views.byDay} days={m.days} label="Page views" />
          <p className="small" style={{ margin: "6px 0 0" }}>{m.views.total30.toLocaleString("en-IN")} views in 30 days</p>
        </section>
      </div>

      <h2 className="admin-h2">Content</h2>
      <div className="tiles">
        <Tile label="Published pieces" value={published} />
        <Tile label="Newsletter open rate" value={pct(m.newsletter.avgOpenRate)} note="Average of sent issues" href="/admin/newsletters" />
        <Tile label="Newsletter click rate" value={pct(m.newsletter.avgClickRate)} href="/admin/newsletters" />
        <Tile label="Last issue sent" value={lastSend ? new Date(lastSend.sentAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : "–"} note={lastSend?.title} />
      </div>
      <div className="panels">
        <section className="panel">
          <h3>By section</h3>
          <table className="table">
            <thead><tr><th>Section</th><th>Published</th><th>Drafts</th><th>Featured</th><th>Views (30d)</th></tr></thead>
            <tbody>
              {SECTION_LIST.map((s) => {
                const c = m.content[s.type as PieceType];
                return (
                  <tr key={s.type}>
                    <td><Link href={s.adminPath}>{s.type === "newsletter" ? "Newsletters" : s.plural}</Link></td>
                    <td>{c.published}</td>
                    <td>{c.drafts}</td>
                    <td>{s.type === "newsletter" ? "–" : `${c.featured} / ${MAX_FEATURED}`}</td>
                    <td>{c.views30.toLocaleString("en-IN")}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </section>
        <section className="panel">
          <h3>Most read (30 days)</h3>
          {m.topPieces.length ? (
            <ol className="top-list">
              {m.topPieces.map((p) => (
                <li key={p.id}>
                  <Link href={`/admin/edit/${p.id}`}>{p.title}</Link>
                  <span className="small">{SECTIONS[p.type].label} · {p.views.toLocaleString("en-IN")} views</span>
                </li>
              ))}
            </ol>
          ) : (
            <p className="small">No views yet. Open a few published pieces on the site and they&apos;ll show up here.</p>
          )}
        </section>
      </div>
    </main>
  );
}
