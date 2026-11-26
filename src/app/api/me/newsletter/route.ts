import { NextResponse } from "next/server";
import { sameOrigin } from "@/lib/admin-auth";
import { getReader } from "@/lib/reader";
import { serviceClient } from "@/lib/repo";

// Turn the weekly email on or off from the profile page. The account's email is already
// verified (Google, or the sign-up confirmation), so no second confirmation is needed.
export async function POST(request: Request) {
  if (!sameOrigin(request)) return NextResponse.json({ error: "Blocked." }, { status: 403 });
  const r = await getReader();
  if (!r?.email) return NextResponse.json({ error: "Log in first." }, { status: 401 });
  const db = serviceClient();
  if (!db) return NextResponse.json({ error: "Needs the database." }, { status: 503 });
  const on = Boolean((await request.json().catch(() => ({}))).on);
  const email = r.email.toLowerCase();
  const { data: existing } = await db.from("subscribers").select("id").eq("email", email).maybeSingle();
  const patch = on
    ? { status: "active", user_id: r.id, confirmed_at: new Date().toISOString() }
    : { status: "unsubscribed", user_id: r.id };
  const { error } = existing
    ? await db.from("subscribers").update(patch).eq("id", existing.id)
    : await db.from("subscribers").insert({ email, source: "profile", ...patch });
  if (error) return NextResponse.json({ error: "Couldn't save. Try again." }, { status: 500 });
  return NextResponse.json({ ok: true, on });
}
