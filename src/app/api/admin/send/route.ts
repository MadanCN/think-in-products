import { NextResponse } from "next/server";
import { denyUnlessAdmin } from "@/lib/admin-auth";
import { SEGMENT_ID, broadcastsEnabled, reconcileList } from "@/lib/email/audience";
import { FROM, getResend, renderPieceEmail } from "@/lib/email/send";
import { getPiece, serviceClient } from "@/lib/repo";
import { SITE_URL } from "@/lib/supabase/env";

type Body = { pieceId: string; mode: "test" | "send"; testEmail?: string; audience?: "all" | "free" | "paid" };

// Only newsletter issues are sent by email. A test to yourself first, then subscribers.
export async function POST(request: Request) {
  const denied = await denyUnlessAdmin(request);
  if (denied) return denied;
  const body = (await request.json()) as Body;
  const db = serviceClient();
  const resend = getResend();
  if (!db) return NextResponse.json({ error: "Connect Supabase (with the service role key) to send email." }, { status: 400 });
  if (!resend) return NextResponse.json({ error: "Add RESEND_API_KEY to send email." }, { status: 400 });

  const piece = await getPiece(body.pieceId);
  if (!piece) return NextResponse.json({ error: "Save the issue first." }, { status: 404 });
  if (piece.type !== "newsletter") return NextResponse.json({ error: "Only newsletter issues are sent by email." }, { status: 400 });

  if (body.mode === "test") {
    if (!body.testEmail) return NextResponse.json({ error: "Add an email address for the test." }, { status: 400 });
    const { error } = await resend.emails.send({ from: FROM, to: body.testEmail, subject: `[Test] ${piece.title}`, html: await renderPieceEmail(piece) });
    return error ? NextResponse.json({ error: error.message }, { status: 500 }) : NextResponse.json({ sent: 1 });
  }
  if (piece.status !== "published") return NextResponse.json({ error: "Publish the issue before sending it." }, { status: 400 });

  const { data: subs, error: subErr } = await db.from("subscribers").select("email, user_id, unsubscribe_token").eq("status", "active").contains("formats", ["newsletter"]);
  if (subErr) return NextResponse.json({ error: subErr.message }, { status: 500 });
  let list = subs ?? [];
  if (body.audience && body.audience !== "all") {
    const { data: members } = await db.from("memberships").select("user_id").eq("status", "active");
    const paid = new Set((members ?? []).map((m) => m.user_id));
    list = list.filter((s) => (body.audience === "paid" ? paid.has(s.user_id) : !paid.has(s.user_id)));
  }
  if (!list.length) return NextResponse.json({ error: "No active subscribers in that audience yet." }, { status: 400 });

  const { data: send } = await db.from("sends").insert({ piece_id: piece.id, audience: body.audience ?? "all", recipient_count: list.length, status: "sending" }).select("id").single();

  // Everyone: one Resend broadcast to the newsletter list. Broadcasts are priced by
  // contacts, not per email, so weekly issues stay on the free plan up to 1,000 people.
  if ((body.audience ?? "all") === "all" && broadcastsEnabled()) {
    try {
      const synced = await reconcileList(list.map((s) => s.email));
      const { data: b, error } = await resend.broadcasts.create({
        segmentId: SEGMENT_ID,
        from: FROM,
        replyTo: process.env.INBOX_NOTIFY_EMAIL || undefined,
        subject: piece.title,
        previewText: piece.subtitle || undefined,
        name: piece.issue_number ? `Issue #${piece.issue_number}: ${piece.title}` : piece.title,
        // Resend swaps this placeholder for each reader's own unsubscribe link.
        html: await renderPieceEmail(piece, "{{{RESEND_UNSUBSCRIBE_URL}}}"),
        send: true,
      });
      if (error || !b) throw new Error(error?.message ?? "Resend didn't accept the broadcast.");
      await db.from("sends").update({ status: "sent", sent_at: new Date().toISOString(), broadcast_id: b.id }).eq("id", send?.id);
      return NextResponse.json({ sent: list.length, broadcast: b.id, listChanges: synced });
    } catch (e) {
      const message = e instanceof Error ? e.message : "Send failed";
      await db.from("sends").update({ status: "failed", error: message }).eq("id", send?.id);
      return NextResponse.json({ error: message }, { status: 500 });
    }
  }

  // Free-only or paid-only issues (and setups without a Resend list) go one email each.
  let sent = 0;
  try {
    for (let i = 0; i < list.length; i += 100) {
      const chunk = list.slice(i, i + 100);
      const emails = await Promise.all(
        chunk.map(async (s) => {
          const unsub = `${SITE_URL}/unsubscribe?token=${s.unsubscribe_token}`;
          return {
            from: FROM,
            to: s.email,
            subject: piece.title,
            html: await renderPieceEmail(piece, unsub),
            headers: { "List-Unsubscribe": `<${unsub}>`, "List-Unsubscribe-Post": "List-Unsubscribe=One-Click" },
            tags: [{ name: "send_id", value: String(send?.id ?? "none") }],
          };
        }),
      );
      const { error } = await resend.batch.send(emails);
      if (error) throw new Error(error.message);
      sent += chunk.length;
    }
    await db.from("sends").update({ status: "sent", sent_at: new Date().toISOString() }).eq("id", send?.id);
    return NextResponse.json({ sent });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Send failed";
    await db.from("sends").update({ status: "failed", error: message }).eq("id", send?.id);
    return NextResponse.json({ error: `${message} (${sent} sent before the error)` }, { status: 500 });
  }
}
