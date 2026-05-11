import { NextRequest } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";
import { verifyUnsubscribeToken } from "@/lib/unsubscribeToken";

function page(
  title: string,
  body: string,
  isError = false
): Response {
  const accent = isError ? "#EF4444" : "#00E5CC";
  const icon = isError ? "⚠" : "✓";

  return new Response(
    `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title} — Think In Products</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
      background: #080C14;
      color: #F1F5F9;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px;
    }
    .card {
      max-width: 480px;
      width: 100%;
      background: #0D1420;
      border: 1px solid #1E293B;
      border-radius: 20px;
      padding: 44px 40px;
      text-align: center;
    }
    .icon {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 56px;
      height: 56px;
      border-radius: 50%;
      background: ${accent}1a;
      border: 1px solid ${accent}33;
      color: ${accent};
      font-size: 24px;
      margin-bottom: 20px;
    }
    h1 {
      font-size: 22px;
      font-weight: 700;
      color: ${accent};
      margin-bottom: 12px;
      letter-spacing: -0.02em;
    }
    p {
      color: #94A3B8;
      line-height: 1.7;
      font-size: 15px;
    }
    a {
      display: inline-block;
      margin-top: 28px;
      font-size: 12px;
      font-family: monospace;
      color: #475569;
      text-decoration: none;
      letter-spacing: 0.05em;
    }
    a:hover { color: #94A3B8; }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">${icon}</div>
    <h1>${title}</h1>
    <p>${body}</p>
    <a href="/">&larr; Back to Think In Products</a>
  </div>
</body>
</html>`,
    {
      status: isError ? 400 : 200,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    }
  );
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const email = searchParams.get("email");
  const token = searchParams.get("token");

  if (!email || !token) {
    return page(
      "Invalid link",
      "This unsubscribe link is missing required information. Please use the link from your email.",
      true
    );
  }

  if (!verifyUnsubscribeToken(email, token)) {
    return page(
      "Invalid token",
      "This unsubscribe link is invalid or has expired. Please use the link from your most recent email.",
      true
    );
  }

  try {
    const supabase = createServerSupabaseClient();
    const { error } = await supabase
      .from("newsletter_subscribers")
      .update({
        status: "unsubscribed",
        unsubscribed_at: new Date().toISOString(),
      })
      .eq("email", email.toLowerCase().trim());

    if (error) throw error;

    return page(
      "You've been unsubscribed",
      "You've been removed from the Think In Products list. No more emails from us. If this was a mistake, you can re-subscribe any time on the site."
    );
  } catch (err) {
    console.error("[unsubscribe] error:", err);
    return page(
      "Something went wrong",
      "We couldn't process your unsubscription. Please try again or reply to any email from us.",
      true
    );
  }
}
