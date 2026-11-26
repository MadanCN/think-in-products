import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PieceView } from "@/components/blocks/PieceView";
import { PieceCard } from "@/components/PieceCard";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";
import { SubscribeForm } from "@/components/SubscribeForm";
import { ViewBeacon } from "@/components/ViewBeacon";
import { Comments } from "@/components/account/Comments";
import { ReadTracker } from "@/components/account/ReadTracker";
import Link from "next/link";
import { PREVIEW_BLOCKS, canRead, getPublishedPiece, getRelated } from "@/lib/content";
import { getAuthor } from "@/lib/repo";
import { JsonLd, pieceJsonLd, pieceMetadata } from "@/lib/seo";
import { getViewer } from "@/lib/supabase/server";
import { SECTIONS, pieceUrl, type PieceType } from "@/lib/types";

export async function pieceMeta(type: PieceType, slug: string): Promise<Metadata> {
  const piece = await getPublishedPiece(type, slug);
  return piece ? pieceMetadata(piece, await getAuthor(piece.author)) : { title: "Not found", robots: { index: false } };
}

export async function PiecePage({ type, slug }: { type: PieceType; slug: string }) {
  const piece = await getPublishedPiece(type, slug);
  if (!piece) notFound();

  const viewer = await getViewer();
  const allowed = piece.access === "free" || viewer?.isAdmin || canRead(piece.access, viewer?.plan ?? "free");
  const shown = allowed ? piece : { ...piece, blocks: piece.blocks.slice(0, PREVIEW_BLOCKS) };
  const related = type === "newsletter" ? [] : await getRelated(piece);
  const author = await getAuthor(piece.author);

  return (
    <>
      <JsonLd data={pieceJsonLd(piece, author)} />
      <ViewBeacon id={piece.id} />
      {allowed ? <ReadTracker pieceId={piece.id} /> : null}
      <SiteHeader active={type} />
      <main id="main">
        <PieceView piece={shown} author={author} locked={!allowed} lockedPlan={piece.access} />
        <section className="wrap when-unsub" style={{ paddingBottom: 56 }}>
          <div className="col taped" style={{ padding: "clamp(24px, 4vw, 40px)" }}>
            <h2 style={{ margin: "0 0 8px", fontSize: 30, fontWeight: 800, fontStretch: "78%" }}>
              {type === "newsletter" ? "Get the next issue in your inbox" : "Liked this? Get the weekly newsletter"}
            </h2>
            <p style={{ margin: "0 0 18px", color: "var(--ink-2)" }}>One email a week with what&apos;s new, a practical tip, and links to the week&apos;s pieces.</p>
            <SubscribeForm source={`piece:${piece.slug}`} />
          </div>
        </section>
        {type !== "newsletter" ? <Comments pieceId={piece.id} pieceUrl={pieceUrl(piece)} /> : null}
        {type !== "newsletter" ? (
          <section className="wrap" style={{ paddingBottom: 72 }}>
            <p className="col write-for-us-line">
              Would you like to publish your piece in ThinkInProducts? <Link href="/write-for-us">Pitch your idea</Link>
            </p>
          </section>
        ) : null}
        {related.length ? (
          <section className="wrap" style={{ paddingBottom: 80 }} aria-labelledby="related-h">
            <h2 id="related-h" className="h2" style={{ fontSize: 32, marginBottom: 20 }}>Read next</h2>
            <div className="grid-3">{related.map((p) => <PieceCard key={p.id} piece={p} />)}</div>
          </section>
        ) : null}
      </main>
      <SiteFooter />
    </>
  );
}

export { SECTIONS };
