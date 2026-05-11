import { NextRequest, NextResponse } from "next/server";
import React from "react";
import { z } from "zod";
import { render } from "@react-email/render";
import { createServerSupabaseClient } from "@/lib/supabase";
import { resend, FROM_EMAIL } from "@/lib/resend";
import WelcomeEmail from "@/lib/emails/WelcomeEmail";
import { generateUnsubscribeToken } from "@/lib/unsubscribeToken";

const schema = z.object({
  email: z.string().email("Please enter a valid email address."),
  name: z.string().max(100).optional(),
  source: z.string().max(50).optional(),
});

export async function POST(req: NextRequest) {
  // ── 1. Parse + validate ────────────────────────────────────────────────
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input." },
      { status: 400 }
    );
  }

  const { email, name, source = "homepage" } = parsed.data;
  const normalised = email.toLowerCase().trim();

  // ── 2. Check for existing subscriber ──────────────────────────────────
  const supabase = createServerSupabaseClient();

  const { data: existing, error: fetchError } = await supabase
    .from("newsletter_subscribers")
    .select("id, status")
    .eq("email", normalised)
    .maybeSingle();

  if (fetchError) {
    console.error("[subscribe] fetch error:", fetchError.message);
    return NextResponse.json({ error: "Failed to check subscription." }, { status: 500 });
  }

  // ── 3. Insert or re-activate ───────────────────────────────────────────
  if (existing) {
    if (existing.status === "active") {
      return NextResponse.json(
        { error: "This email is already subscribed." },
        { status: 409 }
      );
    }
    // Re-activate a previously unsubscribed address
    const { error } = await supabase
      .from("newsletter_subscribers")
      .update({
        status: "active",
        subscribed_at: new Date().toISOString(),
        unsubscribed_at: null,
        name: name ?? null,
      })
      .eq("id", existing.id);

    if (error) {
      console.error("[subscribe] re-activate error:", error.message);
      return NextResponse.json({ error: "Failed to update subscription." }, { status: 500 });
    }
  } else {
    const { error } = await supabase.from("newsletter_subscribers").insert({
      email: normalised,
      name: name ?? null,
      status: "active",
      source,
      subscribed_at: new Date().toISOString(),
    });

    if (error) {
      console.error("[subscribe] insert error:", error.message);
      return NextResponse.json({ error: "Failed to save subscription." }, { status: 500 });
    }
  }

  // ── 4. Send welcome email ──────────────────────────────────────────────
  if (process.env.RESEND_API_KEY) {
    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL ?? "https://thinkinproducts.com";
    const token = generateUnsubscribeToken(normalised);
    const unsubscribeUrl = `${siteUrl}/api/unsubscribe?email=${encodeURIComponent(normalised)}&token=${encodeURIComponent(token)}`;

    try {
      const html = await render(
        React.createElement(WelcomeEmail, { name, unsubscribeUrl, siteUrl })
      );

      await resend.emails.send({
        from: FROM_EMAIL,
        to: normalised,
        subject: "Welcome to Think In Products",
        html,
      });
    } catch (err) {
      // Non-fatal — subscriber is already saved; log and continue
      console.error("[subscribe] email send failed:", err);
    }
  }

  return NextResponse.json({ success: true });
}
