import { NextResponse } from "next/server";
import { getReader, readingHistory, recommendFor } from "@/lib/reader";
import { pieceUrl, PIECE_TYPE_LABEL, type Piece } from "@/lib/types";

const card = (p: Piece) => ({ id: p.id, title: p.title, url: pieceUrl(p), type: PIECE_TYPE_LABEL[p.type], minutes: p.reading_minutes, cover: p.cover?.src ?? "" });

// The "welcome back" strip on the home page.
export async function GET() {
  const r = await getReader();
  if (!r) return NextResponse.json({ signedIn: false }, { headers: { "Cache-Control": "private, no-store" } });
  const history = await readingHistory(r.id);
  const recommended = await recommendFor(history, 3);
  const unfinished = history.filter((h) => !h.completed).slice(0, 1)[0];
  return NextResponse.json(
    {
      signedIn: true,
      name: r.name.split(" ")[0],
      continue: unfinished ? { ...card(unfinished.piece), progress: unfinished.progress } : null,
      recommended: recommended.map(card),
      readCount: history.length,
    },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}
