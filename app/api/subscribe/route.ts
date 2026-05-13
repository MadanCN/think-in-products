import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createServerSupabaseClient } from "@/lib/supabase";
import { resend, FROM_EMAIL } from "@/lib/resend";
import { mdToHtml } from "@/lib/mdToHtml";
import { generateUnsubscribeToken } from "@/lib/unsubscribeToken";
import { logActivity } from "@/app/actions/activity";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://thinkinproducts.com";

function buildWelcomeHtml(opts: {
  subject: string;
  greeting: string;
  bodyHtml: string;
  unsubUrl: string;
}): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1.0"/>
<title>${opts.subject}</title>
</head>
<body style="margin:0;padding:0;background:#F1F5F9;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" border="0">
  <tr>
    <td align="center" style="padding:40px 16px">
      <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;background:#ffffff;border:1px solid #E2E8F0;border-radius:12px;overflow:hidden">

        <!-- Header -->
        <tr>
          <td style="padding:20px 40px;border-bottom:1px solid #E2E8F0;background:#ffffff">
            <table cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td style="vertical-align:middle;padding-right:10px">
                  <img src="https://i.postimg.cc/8zMFDKGG/logo.png" alt="" width="32" height="32" style="display:block;width:32px;height:32px;object-fit:contain"/>
                </td>
                <td style="vertical-align:middle">
                  <p style="margin:0;font-size:13px;font-weight:700;letter-spacing:0.15em;color:#00A896;font-family:monospace;text-transform:uppercase">Think in Products</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:36px 40px;color:#1E293B;font-size:15px;line-height:1.7">
            <p style="margin:0 0 20px;font-size:15px;font-weight:600;color:#1E293B">${opts.greeting}</p>
            ${opts.bodyHtml}
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding:20px 40px 28px;border-top:1px solid #E2E8F0;background:#F8FAFC">
            <p style="margin:0 0 8px;font-size:12px;color:#94A3B8;line-height:1.6">
              You're receiving this because you subscribed to Think in Products.
            </p>
            <p style="margin:0;font-size:12px">
              <a href="${opts.unsubUrl}" style="color:#94A3B8;text-decoration:underline">Unsubscribe</a>
              <span style="color:#CBD5E1;margin:0 8px">|</span>
              <a href="${SITE_URL}" style="color:#94A3B8;text-decoration:underline">Visit site</a>
            </p>
          </td>
        </tr>

      </table>
    </td>
  </tr>
</table>
</body>
</html>`;
}

const schema = z.object({
  email: z.string().email("Please enter a valid email address."),
  name: z.string().max(100).optional(),
  source: z.string().max(50).optional(),
});

export async function POST(req: NextRequest) {
  // 1. Parse + validate
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

  const { email, name, source = "homepage" } = parsed.data;
  const normalised = email.toLowerCase().trim();

  // 2. Check for existing subscriber
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

  // 3. Insert or re-activate
  if (existing) {
    if (existing.status === "active") {
      return NextResponse.json({ error: "This email is already subscribed." }, { status: 409 });
    }
    const { error } = await supabase
      .from("newsletter_subscribers")
      .update({ status: "active", subscribed_at: new Date().toISOString(), unsubscribed_at: null, name: name ?? null })
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

  // 4. Log activity
  void logActivity({ action: "subscriber_added", entity_type: "subscriber", entity_name: normalised });

  // 5. Send welcome email
  if (process.env.RESEND_API_KEY) {
    const token = generateUnsubscribeToken(normalised);
    const unsubUrl = `${SITE_URL}/api/unsubscribe?email=${encodeURIComponent(normalised)}&token=${encodeURIComponent(token)}`;

    try {
      // Load admin-authored template
      const { data: tmplRow } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", "welcome_email")
        .maybeSingle();

      const tmpl = tmplRow?.value as { subject?: string; content?: string } | null;
      const subject = tmpl?.subject ?? "Welcome to Think in Products";
      let rawContent = tmpl?.content ?? "";

      // Replace {{name}} / {{first_name}} merge field
      const firstName = name?.split(" ")[0] ?? "";
      rawContent = rawContent.replace(/\{\{(?:name|first_name)\}\}/gi, firstName || "there");

      const bodyHtml = rawContent ? mdToHtml(rawContent) : "";

      const greeting = firstName ? `Hey ${firstName},` : "Hey,";

      const html = buildWelcomeHtml({ subject, greeting, bodyHtml, unsubUrl });

      const { data, error: sendError } = await resend.emails.send({
        from: FROM_EMAIL,
        to: normalised,
        subject,
        html,
      });

      if (sendError) {
        console.error(`[subscribe] Resend error — ${sendError.name}: ${sendError.message}`);
      }
    } catch (err) {
      console.error("[subscribe] Unexpected email error:", err);
    }
  }

  return NextResponse.json({ success: true });
}
