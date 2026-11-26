import { NextResponse } from "next/server";
import { denyUnlessAdmin } from "@/lib/admin-auth";
import { renderPieceEmail } from "@/lib/email/send";
import type { Piece } from "@/lib/types";

// The newsletter editor's "Email" preview posts the current draft here.
export async function POST(request: Request) {
  const denied = await denyUnlessAdmin(request);
  if (denied) return denied;
  const piece = (await request.json()) as Piece;
  return NextResponse.json({ html: await renderPieceEmail(piece) });
}
