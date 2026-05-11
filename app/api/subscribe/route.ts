import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";
import { resend } from "@/lib/resend";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email } = body;

    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json({ error: "A valid email address is required." }, { status: 400 });
    }

    const normalised = email.toLowerCase().trim();
    const supabase = createServerSupabaseClient();

    // Upsert into newsletter_subscribers — idempotent on email
    const { error: dbError } = await supabase
      .from("newsletter_subscribers")
      .upsert(
        { email: normalised, status: "active", subscribed_at: new Date().toISOString() },
        { onConflict: "email", ignoreDuplicates: true }
      );

    if (dbError) {
      console.error("[subscribe] DB error:", dbError.message);
      return NextResponse.json({ error: "Failed to save subscription." }, { status: 500 });
    }

    // Send welcome email via Resend
    if (process.env.RESEND_API_KEY) {
      await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL ?? "hello@thinkinproducts.com",
        to: normalised,
        subject: "Welcome to Think in Products",
        html: `
          <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto; color: #F1F5F9; background: #080C14; padding: 40px 32px; border-radius: 12px;">
            <h1 style="font-size: 24px; font-weight: 700; color: #00E5CC; margin-bottom: 16px;">You're in.</h1>
            <p style="color: #94A3B8; line-height: 1.6;">
              Thanks for subscribing to Think in Products. Every two weeks you'll get one piece of writing — no noise, no roundups. Just the thing and why it matters.
            </p>
            <p style="color: #94A3B8; line-height: 1.6; margin-top: 16px;">
              While you're here, start with the <a href="${process.env.NEXT_PUBLIC_SITE_URL}/roadmap" style="color: #00E5CC;">PM Roadmap</a> — it's the fastest way to orient yourself.
            </p>
            <p style="color: #475569; font-size: 13px; margin-top: 32px;">
              You can unsubscribe any time by replying "unsubscribe".
            </p>
          </div>
        `,
      });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[subscribe] Unexpected error:", err);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
