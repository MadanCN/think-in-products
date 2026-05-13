import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";
import { createSessionClient } from "@/lib/supabase-server";
import { logActivity } from "@/app/actions/activity";
import { resend, FROM_EMAIL } from "@/lib/resend";
import { mdToHtml } from "@/lib/mdToHtml";
import { generateUnsubscribeToken } from "@/lib/unsubscribeToken";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://thinkinproducts.com";
const BATCH_SIZE = 100;

function buildEmailHtml(opts: {
  subject: string;
  previewText: string;
  bodyHtml: string;
  email: string;
  unsubToken: string;
}): string {
  const unsubUrl = `${SITE_URL}/api/unsubscribe?email=${encodeURIComponent(opts.email)}&token=${opts.unsubToken}`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<meta name="x-apple-disable-message-reformatting" />
<title>${opts.subject}</title>
<!--[if mso]><style>td,th,div,p,a,h1,h2,h3{font-family:Arial,sans-serif!important;}</style><![endif]-->
<span style="display:none;max-height:0;overflow:hidden;mso-hide:all">${opts.previewText}</span>
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
                  <img src="${SITE_URL}/logo.png" alt="" width="32" height="32" style="display:block;width:32px;height:32px;object-fit:contain" />
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
              <a href="${unsubUrl}" style="color:#94A3B8;text-decoration:underline">Unsubscribe</a>
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

export async function POST(req: NextRequest) {
  // Auth: verify the user's session via cookies (service-role key can't do this)
  const sessionClient = createSessionClient();
  const { data: { user } } = await sessionClient.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Use service-role client for all data operations
  const supabase = createServerSupabaseClient();

  const body = await req.json();
  const { broadcastId, test, testEmail } = body as {
    broadcastId: string;
    test?: boolean;
    testEmail?: string;
  };

  if (!broadcastId) {
    return NextResponse.json({ error: "broadcastId is required" }, { status: 400 });
  }

  // Fetch broadcast
  const { data: broadcast, error: bErr } = await supabase
    .from("broadcasts")
    .select("*")
    .eq("id", broadcastId)
    .single();

  if (bErr || !broadcast) {
    return NextResponse.json({ error: "Broadcast not found" }, { status: 404 });
  }

  if (!broadcast.subject?.trim()) {
    return NextResponse.json({ error: "Broadcast has no subject" }, { status: 400 });
  }

  const bodyHtml = mdToHtml(broadcast.content ?? "");
  const previewText = broadcast.preview_text ?? "";

  // Test send
  if (test) {
    const to = testEmail ?? user.email ?? "";
    if (!to) {
      return NextResponse.json({ error: "No test email address" }, { status: 400 });
    }

    const token = generateUnsubscribeToken(to);
    const html = buildEmailHtml({
      subject: `[TEST] ${broadcast.subject}`,
      previewText,
      bodyHtml,
      email: to,
      unsubToken: token,
    });

    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: `[TEST] ${broadcast.subject}`,
      html,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ sent: 1 });
  }

  // Full send — fetch all active subscribers
  const { data: subscribers, error: subErr } = await supabase
    .from("newsletter_subscribers")
    .select("email, name")
    .eq("status", "active");

  if (subErr) {
    return NextResponse.json({ error: subErr.message }, { status: 500 });
  }

  const list = subscribers ?? [];
  if (list.length === 0) {
    return NextResponse.json({ error: "No active subscribers" }, { status: 400 });
  }

  // Send in batches of BATCH_SIZE
  let totalSent = 0;
  for (let i = 0; i < list.length; i += BATCH_SIZE) {
    const chunk = list.slice(i, i + BATCH_SIZE);
    const messages = chunk.map((sub) => {
      const token = generateUnsubscribeToken(sub.email);
      const html = buildEmailHtml({
        subject: broadcast.subject,
        previewText,
        bodyHtml,
        email: sub.email,
        unsubToken: token,
      });
      return {
        from: FROM_EMAIL,
        to: sub.email,
        subject: broadcast.subject as string,
        html,
      };
    });

    const { error } = await resend.batch.send(messages);
    if (error) {
      return NextResponse.json(
        { error: `Batch failed at offset ${i}: ${error.message}`, sent: totalSent },
        { status: 500 }
      );
    }
    totalSent += chunk.length;
  }

  // Mark broadcast as sent
  await supabase
    .from("broadcasts")
    .update({
      status: "sent",
      sent_at: new Date().toISOString(),
      recipient_count: totalSent,
      updated_at: new Date().toISOString(),
    })
    .eq("id", broadcastId);

  void logActivity({
    action: "broadcast_sent",
    entity_type: "broadcast",
    entity_name: broadcast.subject,
    details: { recipient_count: totalSent },
  });

  return NextResponse.json({ sent: totalSent });
}
