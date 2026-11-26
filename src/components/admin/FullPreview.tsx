"use client";

import { useEffect, useState } from "react";
import { PieceView } from "@/components/blocks/PieceView";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";
import type { Author, Piece } from "@/lib/types";
import { draftKey } from "./store";

// Full-page preview in its own tab. It reads the draft the editor keeps in this
// browser and updates live as you type in the other tab.
export function FullPreview({ id }: { id: string }) {
  const [piece, setPiece] = useState<Piece | null>(null);
  const [authors, setAuthors] = useState<Author[]>([]);
  useEffect(() => {
    fetch("/api/admin/authors", { cache: "no-store" }).then((r) => r.json()).then((d) => setAuthors(d.authors ?? [])).catch(() => null);
  }, []);
  useEffect(() => {
    const read = () => {
      try {
        const raw = localStorage.getItem(draftKey(id));
        if (raw) setPiece(JSON.parse(raw));
      } catch {}
    };
    read();
    const onStorage = (e: StorageEvent) => {
      if (e.key === draftKey(id)) read();
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [id]);
  if (!piece) return <p style={{ padding: 40 }}>Open this from the editor&apos;s &quot;Open full page&quot; button.</p>;
  return (
    <>
      <div style={{ position: "sticky", top: 0, zIndex: 10, background: "var(--highlighter)", borderBottom: "2px solid var(--graphite)", padding: "6px 16px", fontSize: 14, fontWeight: 700, textAlign: "center" }}>
        Preview: this is how the page will look. It updates as you edit.
      </div>
      <SiteHeader active={piece.type} />
      <PieceView piece={piece} author={authors.find((a) => a.slug === piece.author) ?? null} />
      <SiteFooter />
    </>
  );
}
