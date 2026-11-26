import { NextResponse } from "next/server";
import { trackView } from "@/lib/repo";
import { clientIp, rateLimit } from "@/lib/security/rate-limit";

// One view of a published piece (sent once per browser session by ViewBeacon).
export async function POST(request: Request) {
  if (!rateLimit(`track:${clientIp(request)}`, 30, 60_000).ok) return NextResponse.json({ ok: true });
  const body = await request.json().catch(() => ({}));
  const id = String(body.id ?? "");
  if (!/^[a-z0-9-]{4,64}$/i.test(id)) return NextResponse.json({ ok: false }, { status: 400 });
  if (/bot|crawler|spider|preview/i.test(request.headers.get("user-agent") ?? "")) return NextResponse.json({ ok: true });
  await trackView(id).catch(() => null);
  return NextResponse.json({ ok: true });
}
