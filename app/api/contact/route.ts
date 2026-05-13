import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { resend, FROM_EMAIL } from "@/lib/resend";

const schema = z.object({
  name:    z.string().min(1, "Name is required.").max(100),
  email:   z.string().email("Please provide a valid email address."),
  message: z.string().min(1, "Message is required.").max(2000, "Message must be under 2000 characters."),
});

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "madan@accessionhealthtech.com";

export async function POST(req: NextRequest) {
  let body: unknown;
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: "Invalid request body." }, { status: 400 }); }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input." },
      { status: 400 }
    );
  }

  const { name, email, message } = parsed.data;

  if (process.env.RESEND_API_KEY) {
    try {
      await resend.emails.send({
        from: FROM_EMAIL,
        to: [ADMIN_EMAIL],
        reply_to: email,
        subject: `Contact form: ${name}`,
        html: `
          <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto; color: #F1F5F9; background: #080C14; padding: 40px 32px; border-radius: 12px;">
            <h2 style="font-size: 18px; font-weight: 700; color: #00E5CC; margin-bottom: 20px;">New Contact Message</h2>
            <p><strong style="color: #94A3B8;">From:</strong> ${name} &lt;${email}&gt;</p>
            <div style="margin-top: 20px; padding: 20px; background: #0D1320; border-radius: 8px; border-left: 3px solid #00E5CC;">
              <p style="color: #F1F5F9; line-height: 1.7; white-space: pre-wrap;">${message}</p>
            </div>
          </div>
        `,
      });
    } catch (err) {
      console.error("[contact] Resend error:", err);
      return NextResponse.json({ error: "Failed to send message." }, { status: 500 });
    }
  }

  return NextResponse.json({ success: true });
}
