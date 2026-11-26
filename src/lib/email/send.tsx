import { render } from "@react-email/render";
import { Resend } from "resend";
import { SITE_URL } from "../supabase/env";
import type { Piece } from "../types";
import { PieceEmail } from "./PieceEmail";

export const FROM = process.env.EMAIL_FROM ?? "ThinkInProducts <notes@example.com>";

export function getResend() {
  const key = process.env.RESEND_API_KEY;
  return key ? new Resend(key) : null;
}

export async function renderPieceEmail(piece: Piece, unsubscribeUrl = `${SITE_URL}/unsubscribe`) {
  return render(<PieceEmail piece={piece} siteUrl={SITE_URL} unsubscribeUrl={unsubscribeUrl} />);
}

export function confirmEmailHtml(confirmUrl: string) {
  return `<!doctype html><html><body style="margin:0;padding:24px;background:#e8efe2;font-family:Segoe UI,Helvetica,Arial,sans-serif;color:#22262b">
<div style="max-width:520px;margin:0 auto;background:#f7faf4;border:2px solid #22262b;padding:28px">
<p style="font-size:22px;font-weight:800;margin:0 0 16px">think<span style="color:#c8102e">in</span>product</p>
<p style="font-size:20px;font-weight:700;margin:0 0 10px">One click and you're in.</p>
<p style="font-size:16px;margin:0 0 22px">Confirm your email to get the ThinkInProducts newsletter: one issue a week, with the best new articles, case studies and product breakdowns.</p>
<a href="${confirmUrl}" style="display:inline-block;background:#c8102e;color:#f7faf4;text-decoration:none;font-weight:700;padding:12px 24px;border-radius:999px">Confirm my email</a>
<p style="font-size:13px;color:#555c63;margin:22px 0 0">Didn't sign up? Ignore this email and you won't hear from us.</p>
</div></body></html>`;
}
