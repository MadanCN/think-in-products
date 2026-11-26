import { NextResponse } from "next/server";
import { sameOrigin } from "@/lib/admin-auth";
import { getComment, getReader, removeComment, updateComment } from "@/lib/reader";
import { looksLikeSpam } from "@/lib/security/antispam";
import { rateLimit } from "@/lib/security/rate-limit";

async function own(request: Request, id: string) {
  if (!sameOrigin(request)) return { error: NextResponse.json({ error: "Blocked." }, { status: 403 }) };
  const r = await getReader();
  if (!r) return { error: NextResponse.json({ error: "Log in first." }, { status: 401 }) };
  const c = await getComment(id);
  if (!c || c.user_id !== r.id) return { error: NextResponse.json({ error: "That isn't your comment." }, { status: 404 }) };
  return { r, c };
}

// Edit your own comment.
export async function PATCH(request: Request, ctx: RouteContext<"/api/comments/[id]">) {
  const { id } = await ctx.params;
  const o = await own(request, id);
  if (o.error) return o.error;
  if (!rateLimit(`comment-edit:${o.r.id}`, 20, 10 * 60_000).ok) return NextResponse.json({ error: "Too many edits. Wait a few minutes." }, { status: 429 });
  const body = String((await request.json().catch(() => ({}))).body ?? "").trim();
  if (body.length < 2 || body.length > 4000) return NextResponse.json({ error: "Comments are 2 to 4,000 characters." }, { status: 400 });
  if (looksLikeSpam(body)) return NextResponse.json({ error: "That looks like spam (lots of links?)." }, { status: 400 });
  await updateComment(id, { body, edited_at: new Date().toISOString(), seen: false });
  return NextResponse.json({ ok: true });
}

// Delete your own comment (and its replies).
export async function DELETE(request: Request, ctx: RouteContext<"/api/comments/[id]">) {
  const { id } = await ctx.params;
  const o = await own(request, id);
  if (o.error) return o.error;
  await removeComment(id);
  return NextResponse.json({ ok: true });
}
