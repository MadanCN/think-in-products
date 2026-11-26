import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Avatar } from "@/components/account/Avatar";
import { AccountSettings } from "@/components/account/AccountSettings";
import { PieceCard } from "@/components/PieceCard";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";
import { answerCount, getReader, readerComments, readingHistory, recommendFor } from "@/lib/reader";
import { getFeatured } from "@/lib/content";
import { serviceClient } from "@/lib/repo";
import { SECTIONS, pieceUrl } from "@/lib/types";

export const metadata: Metadata = { title: "Your profile", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

const day = (iso: string) => new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
function ago(iso: string) {
  const d = Math.floor((Date.now() - new Date(iso).getTime()) / 864e5);
  return d <= 0 ? "Today" : d === 1 ? "Yesterday" : d < 7 ? `${d} days ago` : day(iso);
}

// A small streak-ish nudge: days with reading in the last 7.
function daysReadThisWeek(dates: string[]) {
  const since = Date.now() - 7 * 864e5;
  return new Set(dates.filter((d) => new Date(d).getTime() > since).map((d) => d.slice(0, 10))).size;
}

export default async function AccountPage() {
  const me = await getReader();
  if (!me) redirect("/login?next=/account");

  const db = serviceClient();
  const [history, comments, calls, sub] = await Promise.all([
    readingHistory(me.id),
    readerComments(me.id),
    answerCount(me.id),
    db ? db.from("subscribers").select("status").eq("email", me.email.toLowerCase()).maybeSingle() : Promise.resolve({ data: null }),
  ]);
  const recommended = await recommendFor(history, 6);
  const fallback = recommended.length ? [] : (await getFeatured("article")).slice(0, 3);
  const unfinished = history.filter((h) => !h.completed).slice(0, 3);
  const finished = history.filter((h) => h.completed).length;
  const minutes = history.reduce((n, h) => n + Math.round((h.piece.reading_minutes * h.progress) / 100), 0);
  const first = me.name.split(" ")[0];
  const newsletterOn = sub.data?.status === "active";

  const week = daysReadThisWeek(history.map((h) => h.lastReadAt));

  return (
    <>
      <SiteHeader />
      <main id="main" className="wrap account">
        <section className="account-hero taped">
          <Avatar name={me.name} src={me.avatar} size={112} ring />
          <div style={{ minWidth: 0, flex: 1 }}>
            <p className="hand red" style={{ fontSize: 24, margin: "0 0 4px" }}>{history.length ? `welcome back, ${first}` : `hello, ${first}`}</p>
            <h1 className="display" style={{ fontSize: "clamp(40px, 5vw, 64px)", margin: "0 0 8px" }}>{me.name}</h1>
            {me.bio ? <p className="lead" style={{ margin: "0 0 10px", fontSize: 18 }}>{me.bio}</p> : null}
            <p className="small" style={{ margin: 0 }}>Reader since {day(me.joined)} · {me.provider === "google" ? "Signed in with Google" : me.email}</p>
          </div>
        </section>

        <section className="stat-row" aria-label="Your activity">
          <div><strong>{history.length}</strong><span>pieces opened</span></div>
          <div><strong>{finished}</strong><span>finished</span></div>
          <div><strong>{minutes}</strong><span>minutes read</span></div>
          <div><strong>{calls}</strong><span>calls made</span></div>
          <div><strong>{comments.length}</strong><span>comments</span></div>
          <div><strong>{week}/7</strong><span>days read this week</span></div>
        </section>

        {unfinished.length ? (
          <section className="account-sec" aria-labelledby="continue-h">
            <h2 id="continue-h" className="h2">Continue reading</h2>
            <div className="continue-list">
              {unfinished.map((h) => (
                <Link key={h.piece.id} href={pieceUrl(h.piece)} className="continue-card">
                  <span className="tag" style={{ background: SECTIONS[h.piece.type].color }}>{SECTIONS[h.piece.type].label}</span>
                  <strong>{h.piece.title}</strong>
                  <span className="progress" aria-label={`${h.progress}% read`}><span style={{ width: `${Math.max(4, h.progress)}%` }} /></span>
                  <span className="small">{h.progress}% · about {Math.max(1, Math.round((h.piece.reading_minutes * (100 - h.progress)) / 100))} min left · {ago(h.lastReadAt)}</span>
                </Link>
              ))}
            </div>
          </section>
        ) : null}

        <section className="account-sec" aria-labelledby="rec-h">
          <h2 id="rec-h" className="h2">{history.length ? "Recommended for you" : "Start here"}</h2>
          <p className="small" style={{ margin: "-8px 0 18px" }}>{history.length ? "Picked from the topics you've been reading, and nothing you've opened already." : "Read a few pieces and this fills up with picks based on what you like."}</p>
          <div className="grid-3">{(recommended.length ? recommended : fallback).map((p) => <PieceCard key={p.id} piece={p} />)}</div>
        </section>

        <section id="reading" className="account-sec" aria-labelledby="reading-h">
          <h2 id="reading-h" className="h2">Reading history</h2>
          {history.length ? (
            <ul className="history">
              {history.slice(0, 40).map((h) => (
                <li key={h.piece.id}>
                  <Link href={pieceUrl(h.piece)}>
                    <span className="tag" style={{ background: SECTIONS[h.piece.type].color }}>{SECTIONS[h.piece.type].label}</span>
                    <span className="history-title">{h.piece.title}</span>
                    <span className="history-meta">{h.completed ? "Finished" : `${h.progress}% read`} · {ago(h.lastReadAt)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="notice-soft">Nothing yet. Open any <Link href="/articles">article</Link>, <Link href="/case-studies">case study</Link> or <Link href="/breakdowns">breakdown</Link> and it shows up here, with how far you got.</p>
          )}
        </section>

        <section id="comments" className="account-sec" aria-labelledby="your-comments-h">
          <h2 id="your-comments-h" className="h2">Your comments</h2>
          {comments.length ? (
            <ul className="history">
              {comments.map((c) => (
                <li key={c.id}>
                  <Link href={c.piece ? `${pieceUrl(c.piece)}#comment-${c.id}` : "#"}>
                    <span className="history-title" style={{ fontWeight: 500 }}>&ldquo;{c.body.length > 160 ? `${c.body.slice(0, 160)}...` : c.body}&rdquo;</span>
                    <span className="history-meta">on {c.piece?.title ?? "a removed piece"} · {ago(c.createdAt)}{c.status === "hidden" ? " · hidden by a moderator" : ""}</span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="notice-soft">You haven&apos;t commented yet. Every article, case study and breakdown has a discussion at the end.</p>
          )}
        </section>

        <section id="settings" className="account-sec" aria-labelledby="settings-h">
          <h2 id="settings-h" className="h2">Settings</h2>
          <AccountSettings name={me.name} bio={me.bio} notifyReplies={me.notifyReplies} newsletterOn={newsletterOn} email={me.email} />
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
