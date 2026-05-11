import { NextRequest, NextResponse } from "next/server";
import { resend } from "@/lib/resend";

interface ContactPayload {
  name: string;
  email: string;
  message: string;
}

export async function POST(req: NextRequest) {
  try {
    const body: ContactPayload = await req.json();
    const { name, email, message } = body;

    if (!name?.trim() || !email?.trim() || !message?.trim()) {
      return NextResponse.json({ error: "Name, email, and message are all required." }, { status: 400 });
    }

    if (!email.includes("@")) {
      return NextResponse.json({ error: "Please provide a valid email address." }, { status: 400 });
    }

    if (message.length > 2000) {
      return NextResponse.json({ error: "Message must be under 2000 characters." }, { status: 400 });
    }

    if (process.env.RESEND_API_KEY) {
      await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL ?? "hello@thinkinproducts.com",
        to: process.env.RESEND_FROM_EMAIL ?? "hello@thinkinproducts.com",
        reply_to: email.trim(),
        subject: `Contact form: ${name.trim()}`,
        html: `
          <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto; color: #F1F5F9; background: #080C14; padding: 40px 32px; border-radius: 12px;">
            <h2 style="font-size: 18px; font-weight: 700; color: #00E5CC; margin-bottom: 20px;">New Contact Message</h2>
            <p><strong style="color: #94A3B8;">From:</strong> ${name.trim()} &lt;${email.trim()}&gt;</p>
            <div style="margin-top: 20px; padding: 20px; background: #0D1320; border-radius: 8px; border-left: 3px solid #00E5CC;">
              <p style="color: #F1F5F9; line-height: 1.7; white-space: pre-wrap;">${message.trim()}</p>
            </div>
          </div>
        `,
      });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[contact] Unexpected error:", err);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
