import { NextResponse } from "next/server";
import { after } from "next/server";
import { z } from "zod";
import { sameOrigin } from "@/lib/admin-auth";
import { notifyAdminOfComment, sendReplyEmail } from "@/lib/comment-email";
import { commentOwner, countRecentComments, getComment, getReader, insertComment, listComments } from "@/lib/reader";
import { getPiece } from "@/lib/repo";
import { looksLikeSpam } from "@/lib/security/antispam";
import { rateLimit } from "@/lib/security/rate-limit";
import { pieceUrl } from "@/lib/types";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(request: Request) {
  const pieceId = new URL(request.url).searchParams.get("piece") ?? "";
  if (!UUID.test(pieceId)) return NextResponse.json({ comments: [] });
  const r = await getReader();
  const comments = await listComments(pieceId, r?.id ?? null);
  return NextResponse.json(
    { comments, viewer: r ? { name: r.name, avatar: r.avatar, blocked: r.blocked } : null },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}

const Post = z.object({
  pieceId: z.string().regex(UUID),
  parentId: z.string().regex(UUID).nullable().default(null),
  body: z.string().trim().min(2, "Write a little more.").max(4000, "That's long. Keep it under 4,000 characters."),
  website: z.string().optional(),
});

export async function POST(request: Request) {
  if (!sameOrigin(request)) return NextResponse.json({ error: "Blocked." }, { status: 403 });
  const r = await getReader();
  if (!r) return NextResponse.json({ error: "Log in to join the discussion." }, { status: 401 });
  if (r.blocked) return NextResponse.json({ error: "Your account can't post comments right now. Contact us if you think that's a mistake." }, { status: 403 });
  const parsed = Post.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Check your comment." }, { status: 400 });
  const d = parsed.data;
  if (d.website) return NextResponse.json({ ok: true });

  if (!rateLimit(`comment:${r.id}`, 5, 5 * 60_000).ok || (await countRecentComments(r.id, 60)) >= 20) {
    return NextResponse.json({ error: "You're commenting fast. Take a breather and try again in a few minutes." }, { status: 429 });
  }
  if (looksLikeSpam(d.body)) return NextResponse.json({ error: "That looks like spam (lots of links?). Edit it and try again." }, { status: 400 });

  const piece = await getPiece(d.pieceId);
  if (!piece || piece.status !== "published" || piece.type === "newsletter") return NextResponse.json({ error: "Comments are closed here." }, { status: 404 });

  // Replies stay one level deep: replying to a reply attaches to its thread.
  let parentId: string | null = null;
  let replyTo: Awaited<ReturnType<typeof getComment>> = null;
  if (d.parentId) {
    replyTo = await getComment(d.parentId);
    if (!replyTo || replyTo.piece_id !== piece.id || replyTo.status !== "visible") return NextResponse.json({ error: "That comment isn't there any more." }, { status: 404 });
    parentId = replyTo.parent_id ?? replyTo.id;
  }

  const row = await insertComment({ piece_id: piece.id, user_id: r.id, parent_id: parentId, body: d.body });

  after(async () => {
    await notifyAdminOfComment({ name: r.name, pieceTitle: piece.title, text: d.body });
    if (replyTo?.user_id && replyTo.user_id !== r.id) {
      const owner = await commentOwner(replyTo.user_id);
      if (owner?.notify) await sendReplyEmail(owner.email, { replierName: r.name, pieceTitle: piece.title, pieceUrl: pieceUrl(piece), commentId: row.id, text: d.body });
    }
  });
  return NextResponse.json({ ok: true, id: row.id });
}
