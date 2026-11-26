"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { blankPiece } from "@/lib/blocks";
import type { Piece, PieceType } from "@/lib/types";
import { Editor } from "./Editor";
import { draftKey, loadPiece } from "./store";

export function EditorLoader({ id, type, local }: { id?: string; type?: PieceType; local: boolean }) {
  const [piece, setPiece] = useState<Piece | null>(null);
  const [missing, setMissing] = useState(false);
  useEffect(() => {
    // A new piece gets random ids, so make it in the browser only.
    if (!id) {
      if (type) void Promise.resolve().then(() => setPiece(blankPiece(type)));
      return;
    }
    loadPiece(id).then((p) => {
      if (!p) return setMissing(true);
      // Offer back unsaved work from this browser if it differs from the saved copy.
      try {
        const raw = localStorage.getItem(draftKey(id));
        if (raw) {
          const draft = JSON.parse(raw) as Piece;
          if (new Date(draft.updated_at ?? 0) >= new Date(p.updated_at ?? 0) && JSON.stringify(draft.blocks) !== JSON.stringify(p.blocks) && confirm("You have unsaved changes to this piece from earlier. Restore them?")) {
            setPiece({ ...p, ...draft });
            return;
          }
        }
      } catch {}
      setPiece(p);
    });
  }, [id, type]);
  if (missing) return <main className="admin-page"><p>That piece doesn&apos;t exist. <Link href="/admin">Back to the dashboard</Link></p></main>;
  if (!piece) return <main className="admin-page"><p>Loading...</p></main>;
  return <Editor key={piece.id} initial={piece} local={local} />;
}
