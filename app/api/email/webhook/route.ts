import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";

const SUPPORTED_EVENTS = new Set([
  "email.delivered",
  "email.bounced",
  "email.opened",
  "email.clicked",
  "email.complained",
]);

const EVENT_TYPE_MAP: Record<string, string> = {
  "email.delivered":  "delivered",
  "email.bounced":    "bounced",
  "email.opened":     "opened",
  "email.clicked":    "clicked",
  "email.complained": "complained",
};

export async function POST(req: NextRequest) {
  // Verify webhook secret — set RESEND_WEBHOOK_SECRET in Resend dashboard and .env.local
  const secret = req.nextUrl.searchParams.get("secret");
  const expectedSecret = process.env.RESEND_WEBHOOK_SECRET;
  if (!expectedSecret || secret !== expectedSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let payload: { type?: string; data?: Record<string, unknown> };
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { type, data } = payload;

  // Ignore events we don't track
  if (!type || !SUPPORTED_EVENTS.has(type)) {
    return NextResponse.json({ ok: true });
  }

  // Extract broadcast_id from Resend tags
  const tags = (data?.tags ?? []) as Array<{ name: string; value: string }>;
  const broadcastId = tags.find((t) => t.name === "broadcast_id")?.value;
  if (!broadcastId) {
    return NextResponse.json({ ok: true }); // not a broadcast email
  }

  const eventType = EVENT_TYPE_MAP[type];
  const resendEmailId = (data?.email_id ?? data?.id) as string | null | undefined;
  const recipientEmail = (
    Array.isArray(data?.to) ? data.to[0] : data?.to
  ) as string | null | undefined;

  const db = createServerSupabaseClient();
  const { error } = await db.from("broadcast_events").insert({
    broadcast_id:    broadcastId,
    event_type:      eventType,
    recipient_email: recipientEmail ?? null,
    resend_email_id: resendEmailId ?? null,
    occurred_at:     new Date().toISOString(),
  });

  if (error) {
    // Duplicate unique key = already stored this event, that's fine
    if (!error.code?.startsWith("23505")) {
      console.error("[webhook] insert error:", error.message);
      return NextResponse.json({ error: "DB error" }, { status: 500 });
    }
  }

  return NextResponse.json({ ok: true });
}
