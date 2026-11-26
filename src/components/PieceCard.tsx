import Link from "next/link";
import { SECTIONS, pieceUrl, type Piece } from "@/lib/types";

function fmt(iso: string | null) {
  return iso ? new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "";
}

// A card for a piece in lists. "large" shows the cover big; others show a coloured band.
export function PieceCard({ piece, size = "normal", headingLevel = 3 }: { piece: Piece; size?: "large" | "normal" | "row"; headingLevel?: 2 | 3 }) {
  const s = SECTIONS[piece.type];
  const H = headingLevel === 2 ? "h2" : "h3";
  if (size === "row") {
    return (
      <Link href={pieceUrl(piece)} className="card-row">
        <span className="tag" style={{ background: s.color }}>{piece.issue_number ? `Issue #${piece.issue_number}` : piece.category || s.label}</span>
        <span className="card-row-main">
          <H className="card-row-title">{piece.title}</H>
          <span className="card-row-sub">{piece.subtitle}</span>
        </span>
        <span className="card-row-meta">{fmt(piece.published_at)} · {piece.reading_minutes} min</span>
        {piece.access !== "free" ? <span className="tag tag-dark">{piece.access === "plus" ? "Plus" : "Pro"}</span> : null}
      </Link>
    );
  }
  return (
    <Link href={pieceUrl(piece)} className={`card card-${size}`}>
      <div className="card-media" style={{ background: s.color }}>
        {piece.cover?.src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={piece.cover.src} alt="" loading="lazy" />
        ) : (
          <span className="card-media-word" aria-hidden="true">{s.label}</span>
        )}
      </div>
      <div className="card-body">
        <div className="card-meta">
          <span className="tag" style={{ background: s.color }}>{s.label}</span>
          {piece.category ? <span>{piece.category}</span> : null}
          {piece.access !== "free" ? <span className="tag tag-dark">{piece.access === "plus" ? "Plus" : "Pro"}</span> : null}
        </div>
        <H className="card-title">{piece.title}</H>
        <p className="card-sub">{piece.subtitle}</p>
        <span className="card-foot">{fmt(piece.published_at)} · {piece.reading_minutes} min read</span>
      </div>
    </Link>
  );
}
