"use client";

import "./blocks.css";
import Link from "next/link";
import { renderMarkdown } from "@/lib/markdown";
import { SECTIONS, authorUrl, type Author, type Block, type Piece } from "@/lib/types";
import { CreditLine, Figure, Sources, Stats, Timeline, Tip } from "./Extras";
import { MarkedUpImage } from "./MarkedUpImage";
import { AnswersProvider, CheckYourself, MakeTheCall } from "./Quiz";
import { CauseArrows, Chart, Cycle, Venn } from "./Visuals";

export function BlockView({ block }: { block: Block }) {
  switch (block.type) {
    case "text":
      return <div className="prose" dangerouslySetInnerHTML={{ __html: renderMarkdown(block.markdown) }} />;
    case "image":
      return <Figure block={block} />;
    case "margin_note":
      return <p className={`margin-note ${block.pen}`}>{block.text}</p>;
    case "callout":
      return <div className={`callout ${block.tone}`}>{block.text}</div>;
    case "tip":
      return <Tip block={block} />;
    case "make_the_call":
      return <MakeTheCall block={block} />;
    case "check_yourself":
      return <CheckYourself block={block} />;
    case "marked_up_image":
      return <MarkedUpImage block={block} />;
    case "chart":
      return <Chart block={block} />;
    case "cause_arrows":
      return <CauseArrows block={block} />;
    case "venn":
      return <Venn block={block} />;
    case "cycle":
      return <Cycle block={block} />;
    case "timeline":
      return <Timeline block={block} />;
    case "stats":
      return <Stats block={block} />;
    case "sources":
      return <Sources block={block} />;
  }
}

// Blocks that may run wider than the reading column.
const WIDE = new Set(["marked_up_image", "cause_arrows", "stats", "image"]);

function formatDate(iso: string | null) {
  if (!iso) return "Draft";
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
}

// Group each margin note with the block before it, so it can sit in the margin beside it.
function withNotes(blocks: Block[]) {
  const out: { block: Block; note?: Extract<Block, { type: "margin_note" }> }[] = [];
  for (const b of blocks) {
    const prev = out.at(-1);
    if (b.type === "margin_note" && prev && !prev.note && prev.block.type !== "margin_note") prev.note = b;
    else out.push({ block: b });
  }
  return out;
}

// Renders a whole piece. Used by the public pages, the admin's live preview and full-page
// preview, so what you see while writing is exactly what readers get.
export function PieceView({ piece, author, locked, lockedPlan, breadcrumbs = true }: { piece: Piece; author?: Author | null; locked?: boolean; lockedPlan?: string; breadcrumbs?: boolean }) {
  const section = SECTIONS[piece.type];
  return (
    <AnswersProvider>
      <article className="piece">
        <header className="piece-head col">
          {breadcrumbs ? (
            <nav className="crumbs" aria-label="Breadcrumb">
              <Link href="/">Home</Link>
              <span aria-hidden="true">/</span>
              <Link href={section.path}>{section.plural}</Link>
            </nav>
          ) : null}
          <div className="piece-meta">
            <span className="tag" style={{ background: section.color }}>{piece.issue_number ? `Issue #${piece.issue_number}` : section.label}</span>
            {piece.category ? <span>{piece.category}</span> : null}
            <span aria-hidden="true">·</span>
            <time dateTime={piece.published_at ?? undefined}>{formatDate(piece.published_at)}</time>
            <span aria-hidden="true">·</span>
            <span>{piece.reading_minutes} min read</span>
            {piece.access !== "free" ? <span className="tag" style={{ background: "var(--graphite)", color: "var(--sheet)" }}>{piece.access === "plus" ? "Plus" : "Pro"}</span> : null}
          </div>
          <h1 className="piece-title">{piece.title || "Untitled"}</h1>
          {piece.subtitle ? <p className="piece-sub">{piece.subtitle}</p> : null}
          {author ? (
            <div className="byline">
              {author.avatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={author.avatar} alt="" width={44} height={44} />
              ) : null}
              <span>
                By <Link href={authorUrl(author.slug)} rel="author">{author.name}</Link>
                {author.role ? <span className="byline-role">{author.role}</span> : null}
              </span>
            </div>
          ) : null}
        </header>
        {piece.cover?.src ? (
          <figure className="piece-cover wide">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={piece.cover.src} alt={piece.cover.alt} fetchPriority="high" />
            {piece.cover.credit ? <figcaption><CreditLine credit={piece.cover.credit} creditUrl={piece.cover.creditUrl} /></figcaption> : null}
          </figure>
        ) : null}
        <div className="piece-body">
          {withNotes(piece.blocks).map(({ block, note }) => (
            <div key={block.id} id={block.id} className={`block ${WIDE.has(block.type) ? "wide" : "col"}${note ? " has-note" : ""}`}>
              <BlockView block={block} />
              {note ? (
                <aside id={note.id} className="note-slot">
                  <BlockView block={note} />
                </aside>
              ) : null}
            </div>
          ))}
          {locked ? (
            <div className="paywall col">
              <p className="hand" style={{ margin: "0 0 4px", fontSize: 22, color: "var(--highlighter)" }}>the rest of this page is for {lockedPlan === "pro" ? "Pro" : "Plus"} readers</p>
              <h3>Keep reading with {lockedPlan === "pro" ? "Pro" : "Plus"}</h3>
              <p style={{ margin: "0 0 18px", color: "var(--on-dark-2)" }}>Unlock the full archive, every case study and the deep dives.</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                <a className="btn btn-yellow" href="/plans">See plans</a>
                <a className="btn" style={{ color: "var(--sheet)", borderColor: "var(--sheet)" }} href="/login">Log in</a>
              </div>
            </div>
          ) : null}
        </div>
      </article>
    </AnswersProvider>
  );
}
