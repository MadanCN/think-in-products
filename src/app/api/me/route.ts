import { NextResponse } from "next/server";
import { z } from "zod";
import { sameOrigin } from "@/lib/admin-auth";
import { getReader } from "@/lib/reader";
import { serviceClient } from "@/lib/repo";
import { rateLimit } from "@/lib/security/rate-limit";

const noStore = { "Cache-Control": "private, no-store" };

// Who's signed in, for the header and the reading tracker.
export async function GET() {
  const r = await getReader();
  if (!r) return NextResponse.json({ signedIn: false }, { headers: noStore });
  const db = serviceClient();
  const { data: sub } = db && r.email ? await db.from("subscribers").select("status").eq("email", r.email.toLowerCase()).maybeSingle() : { data: null };
  return NextResponse.json({ signedIn: true, id: r.id, name: r.name, avatar: r.avatar, email: r.email, subscribed: sub?.status === "active" }, { headers: noStore });
}

const Patch = z.object({
  name: z.string().trim().min(1, "Add a name people will see next to your comments.").max(60, "Keep your name under 60 characters.").optional(),
  bio: z.string().trim().max(280, "Keep your bio under 280 characters.").optional(),
  notifyReplies: z.boolean().optional(),
});

export async function PATCH(request: Request) {
  if (!sameOrigin(request)) return NextResponse.json({ error: "Blocked." }, { status: 403 });
  const r = await getReader();
  if (!r) return NextResponse.json({ error: "Log in first." }, { status: 401 });
  if (!rateLimit(`me:${r.id}`, 20, 10 * 60_000).ok) return NextResponse.json({ error: "Too many changes. Wait a few minutes." }, { status: 429 });
  const parsed = Patch.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
  const db = serviceClient();
  if (!db) return NextResponse.json({ error: "Accounts need the database." }, { status: 503 });
  const d = parsed.data;
  const { error } = await db
    .from("profiles")
    .update({
      ...(d.name !== undefined ? { name: d.name } : {}),
      ...(d.bio !== undefined ? { bio: d.bio } : {}),
      ...(d.notifyReplies !== undefined ? { notify_replies: d.notifyReplies } : {}),
      updated_at: new Date().toISOString(),
    })
    .eq("id", r.id);
  if (error) return NextResponse.json({ error: "Couldn't save. Try again." }, { status: 500 });
  return NextResponse.json({ ok: true });
}

// Deletes the account and everything tied to it (reading, comments, likes, answers).
export async function DELETE(request: Request) {
  if (!sameOrigin(request)) return NextResponse.json({ error: "Blocked." }, { status: 403 });
  const r = await getReader();
  if (!r) return NextResponse.json({ error: "Log in first." }, { status: 401 });
  const body = await request.json().catch(() => ({}));
  if (body.confirm !== "DELETE") return NextResponse.json({ error: "Type DELETE to confirm." }, { status: 400 });
  const db = serviceClient();
  if (!db) return NextResponse.json({ error: "Accounts need the database." }, { status: 503 });
  await db.from("subscribers").update({ user_id: null }).eq("user_id", r.id);
  const { error } = await db.auth.admin.deleteUser(r.id);
  if (error) return NextResponse.json({ error: "Couldn't delete the account. Contact us and we'll do it." }, { status: 500 });
  const res = NextResponse.json({ ok: true });
  return res;
}
