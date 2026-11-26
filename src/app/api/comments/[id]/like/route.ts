import { NextResponse } from "next/server";
import { sameOrigin } from "@/lib/admin-auth";
import { getComment, getReader, toggleLike } from "@/lib/reader";
import { rateLimit } from "@/lib/security/rate-limit";

export async function POST(request: Request, ctx: RouteContext<"/api/comments/[id]/like">) {
  if (!sameOrigin(request)) return NextResponse.json({ error: "Blocked." }, { status: 403 });
  const { id } = await ctx.params;
  const r = await getReader();
  if (!r) return NextResponse.json({ error: "Log in to like comments." }, { status: 401 });
  if (!rateLimit(`like:${r.id}`, 60, 60_000).ok) return NextResponse.json({ error: "Slow down a little." }, { status: 429 });
  const c = await getComment(id);
  if (!c || c.status !== "visible") return NextResponse.json({ error: "That comment isn't there any more." }, { status: 404 });
  return NextResponse.json({ liked: await toggleLike(id, r.id) });
}
