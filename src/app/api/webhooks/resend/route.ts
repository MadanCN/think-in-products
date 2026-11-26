import { createHmac, timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";
import { syncContact } from "@/lib/email/audience";
import { serviceClient } from "@/lib/repo";

// Resend calls this for each email event (delivered, opened, clicked, bounced...).
// Set it up in Resend -> Webhooks with this URL, and put the signing secret in RESEND_WEBHOOK_SECRET.
function verify(secret: string, id: string, ts: string, body: string, header: string) {
  const key = Buffer.from(secret.replace(/^whsec_/, ""), "base64");
  const expected = createHmac("sha256", key).update(`${id}.${ts}.${body}`).digest("base64");
  return header.split(" ").some((part) => {
    const sig = part.split(",")[1] ?? "";
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    return a.length === b.length && timingSafeEqual(a, b);
  });
}

const TYPES: Record<string, string> = {
  "email.delivered": "delivered",
  "email.opened": "opened",
  "email.clicked": "clicked",
  "email.bounced": "bounced",
  "email.complained": "complained",
};

export async function POST(request: Request) {
  const secret = process.env.RESEND_WEBHOOK_SECRET;
  const body = await request.text();
  if (!secret) return NextResponse.json({ error: "Webhook secret not set" }, { status: 500 });
  const ok = verify(secret, request.headers.get("svix-id") ?? "", request.headers.get("svix-timestamp") ?? "", body, request.headers.get("svix-signature") ?? "");
  if (!ok) return NextResponse.json({ error: "Bad signature" }, { status: 401 });

  const event = JSON.parse(body) as {
    type: string;
    data: { to?: string[]; email?: string; unsubscribed?: boolean; broadcast_id?: string; tags?: Record<string, string> | { name: string; value: string }[] };
  };
  const db = serviceClient();

  // Someone used the unsubscribe link in a broadcast (or was removed in Resend).
  if (event.type === "contact.updated" || event.type === "contact.deleted") {
    const email = event.data.email?.toLowerCase();
    if (db && email && (event.type === "contact.deleted" || event.data.unsubscribed === true)) {
      await db.from("subscribers").update({ status: "unsubscribed" }).eq("email", email).eq("status", "active");
    }
    return NextResponse.json({ ok: true });
  }

  const type = TYPES[event.type];
  if (!type) return NextResponse.json({ ok: true });
  const tags = Array.isArray(event.data.tags) ? Object.fromEntries(event.data.tags.map((t) => [t.name, t.value])) : event.data.tags ?? {};
  let sendId = tags.send_id;
  if (!sendId && event.data.broadcast_id && db) {
    const { data: s } = await db.from("sends").select("id").eq("broadcast_id", event.data.broadcast_id).maybeSingle();
    sendId = s?.id;
  }
  if (db && sendId) {
    await db.from("email_events").insert({ send_id: sendId, email: event.data.to?.[0] ?? null, type });
    if (type === "bounced" || type === "complained") {
      await db.from("subscribers").update({ status: "unsubscribed" }).eq("email", (event.data.to?.[0] ?? "").toLowerCase());
      await syncContact(event.data.to?.[0] ?? "", false);
    }
  }
  return NextResponse.json({ ok: true });
}
