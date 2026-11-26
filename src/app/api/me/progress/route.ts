import { NextResponse } from "next/server";
import { sameOrigin } from "@/lib/admin-auth";
import { getReader, saveProgress } from "@/lib/reader";
import { rateLimit } from "@/lib/security/rate-limit";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// How far a signed-in reader got through a piece.
export async function POST(request: Request) {
  if (!sameOrigin(request)) return NextResponse.json({ error: "Blocked." }, { status: 403 });
  const r = await getReader();
  if (!r) return NextResponse.json({ ok: false }, { status: 401 });
  if (!rateLimit(`progress:${r.id}`, 60, 60_000).ok) return NextResponse.json({ ok: false }, { status: 429 });
  const body = await request.json().catch(() => ({}));
  const pieceId = String(body.pieceId ?? "");
  const progress = Number(body.progress);
  if (!UUID.test(pieceId) || !Number.isFinite(progress)) return NextResponse.json({ ok: false }, { status: 400 });
  await saveProgress(r.id, pieceId, progress).catch(() => null);
  return NextResponse.json({ ok: true });
}
