import { NextResponse } from "next/server";
import { after } from "next/server";
import { z } from "zod";
import { denyUnlessAdmin } from "@/lib/admin-auth";
import { sendReplyEmail } from "@/lib/comment-email";
import { adminListComments, commentOwner, getComment, insertComment, removeComment, setBlocked, updateComment } from "@/lib/reader";
import { getAuthor, getPiece } from "@/lib/repo";
import { DEFAULT_AUTHOR, pieceUrl } from "@/lib/types";

export async function GET(request: Request) {
  const denied = await denyUnlessAdmin(request);
  if (denied) return denied;
  return NextResponse.json({ comments: await adminListComments() }, { headers: { "Cache-Control": "no-store" } });
}

const Patch = z.union([
  z.object({ id: z.string().uuid(), status: z.enum(["visible", "hidden"]) }),
  z.object({ ids: z.array(z.string().uuid()).max(500), seen: z.boolean() }),
  z.object({ userId: z.string().uuid(), blocked: z.boolean() }),
]);

export async function PATCH(request: Request) {
  const denied = await denyUnlessAdmin(request);
  if (denied) return denied;
  const parsed = Patch.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "Bad request." }, { status: 400 });
  const d = parsed.data;
  if ("status" in d) await updateComment(d.id, { status: d.status, seen: true });
  else if ("ids" in d) await Promise.all(d.ids.map((id) => updateComment(id, { seen: d.seen })));
  else await setBlocked(d.userId, d.blocked);
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request) {
  const denied = await denyUnlessAdmin(request);
  if (denied) return denied;
  const id = new URL(request.url).searchParams.get("id") ?? "";
  if (!z.string().uuid().safeParse(id).success) return NextResponse.json({ error: "Bad request." }, { status: 400 });
  await removeComment(id);
  return NextResponse.json({ ok: true });
}

// Reply as the site's author. Shows with an "Author" badge.
export async function POST(request: Request) {
  const denied = await denyUnlessAdmin(request);
  if (denied) return denied;
  const body = await request.json().catch(() => ({}));
  const parentId = String(body.parentId ?? "");
  const text = String(body.body ?? "").trim();
  if (!z.string().uuid().safeParse(parentId).success || text.length < 1 || text.length > 4000) return NextResponse.json({ error: "Write a reply first." }, { status: 400 });
  const parent = await getComment(parentId);
  if (!parent) return NextResponse.json({ error: "That comment was deleted." }, { status: 404 });
  const piece = await getPiece(parent.piece_id);
  const authorSlug = piece?.author || DEFAULT_AUTHOR;
  const author = await getAuthor(authorSlug);
  const row = await insertComment({ piece_id: parent.piece_id, author_slug: authorSlug, parent_id: parent.parent_id ?? parent.id, body: text, seen: true });
  await updateComment(parent.id, { seen: true });
  after(async () => {
    if (parent.user_id && piece) {
      const owner = await commentOwner(parent.user_id);
      if (owner?.notify) await sendReplyEmail(owner.email, { replierName: author?.name ?? "The author", pieceTitle: piece.title, pieceUrl: pieceUrl(piece), commentId: row.id, text });
    }
  });
  return NextResponse.json({ ok: true, id: row.id });
}
