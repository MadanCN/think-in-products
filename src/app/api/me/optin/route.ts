import { NextResponse } from "next/server";
import { sameOrigin } from "@/lib/admin-auth";
import { getReader, optInAtSignIn } from "@/lib/reader";

// Password log-in with the newsletter box ticked. Same rule as Google: never
// re-subscribes someone who unsubscribed.
export async function POST(request: Request) {
  if (!sameOrigin(request)) return NextResponse.json({ error: "Blocked." }, { status: 403 });
  const r = await getReader();
  if (!r) return NextResponse.json({ ok: false }, { status: 401 });
  await optInAtSignIn(r.id, r.email).catch(() => null);
  return NextResponse.json({ ok: true });
}
