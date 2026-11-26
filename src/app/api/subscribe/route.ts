import { NextResponse } from "next/server";
import { FROM, confirmEmailHtml, getResend } from "@/lib/email/send";
import { SITE_URL } from "@/lib/supabase/env";
import { sameOrigin } from "@/lib/admin-auth";
import { clientIp, rateLimit } from "@/lib/security/rate-limit";
import { createAdminClient } from "@/lib/supabase/server";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

// One field, one click: store the email as pending and send a confirmation link.
export async function POST(request: Request) {
  if (!sameOrigin(request)) return NextResponse.json({ error: "Blocked." }, { status: 403 });
  if (!rateLimit(`subscribe:${clientIp(request)}`, 5, 10 * 60_000).ok) return NextResponse.json({ error: "Too many tries. Wait a few minutes and try again." }, { status: 429 });
  const body = await request.json().catch(() => ({}));
  if (body.website) return NextResponse.json({ message: "Almost there. Check your inbox and click the link to confirm." });
  const email = String(body.email ?? "").trim().toLowerCase().slice(0, 200);
  const source = String(body.source ?? "site").slice(0, 60);
  if (!EMAIL.test(email)) return NextResponse.json({ error: "That email address doesn't look right." }, { status: 400 });

  const db = createAdminClient();
  if (!db) {
    console.info(`[local mode] would subscribe ${email} (${source})`);
    return NextResponse.json({ message: "Subscribed (local mode: nothing was saved, connect Supabase to store it)." });
  }

  const { data: existing } = await db.from("subscribers").select("status, confirm_token").eq("email", email).maybeSingle();
  if (existing?.status === "active") return NextResponse.json({ message: "You're already subscribed. See you in your inbox." });

  let token = existing?.confirm_token as string | undefined;
  if (!existing) {
    const { data, error } = await db.from("subscribers").insert({ email, source }).select("confirm_token").single();
    if (error) return NextResponse.json({ error: "We couldn't save that. Try again in a minute." }, { status: 500 });
    token = data.confirm_token;
  } else if (existing.status === "unsubscribed") {
    await db.from("subscribers").update({ status: "pending" }).eq("email", email);
  }

  const resend = getResend();
  const confirmUrl = `${SITE_URL}/api/subscribe/confirm?token=${token}`;
  if (resend) {
    await resend.emails.send({ from: FROM, to: email, subject: "Confirm your ThinkInProducts subscription", html: confirmEmailHtml(confirmUrl) });
  } else {
    console.info(`[no RESEND_API_KEY] confirm link for ${email}: ${confirmUrl}`);
  }
  return NextResponse.json({ message: "Almost there. Check your inbox and click the link to confirm." });
}
