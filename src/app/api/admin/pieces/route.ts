import { NextResponse } from "next/server";
import { denyUnlessAdmin } from "@/lib/admin-auth";
import { FeatureLimitError, importSamples, listPieces, savePiece } from "@/lib/repo";
import type { Piece, PieceStatus, PieceType } from "@/lib/types";

export async function GET(request: Request) {
  const denied = await denyUnlessAdmin(request);
  if (denied) return denied;
  const sp = new URL(request.url).searchParams;
  const pieces = await listPieces({
    type: (sp.get("type") as PieceType) || undefined,
    status: (sp.get("status") as PieceStatus) || undefined,
    q: sp.get("q") || undefined,
    featured: sp.get("featured") === "1" ? true : undefined,
  });
  return NextResponse.json({ pieces });
}

// Save a piece (create or update). Returns 409 with the featured list if the feature limit is reached.
export async function POST(request: Request) {
  const denied = await denyUnlessAdmin(request);
  if (denied) return denied;
  const body = (await request.json()) as Piece & { importSamples?: boolean };
  try {
    if (body.importSamples) return NextResponse.json({ imported: await importSamples() });
    return NextResponse.json({ piece: await savePiece(body) });
  } catch (e) {
    if (e instanceof FeatureLimitError) return NextResponse.json({ error: e.message, featured: e.featured }, { status: 409 });
    return NextResponse.json({ error: e instanceof Error ? e.message : "Couldn't save" }, { status: 400 });
  }
}
