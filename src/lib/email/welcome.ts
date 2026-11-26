import "server-only";
import { listPieces, serviceClient } from "../repo";
import { SITE_URL } from "../supabase/env";
import { PIECE_TYPE_LABEL, pieceUrl, type Piece } from "../types";
import { FROM, getResend } from "./send";

// The first email a new subscriber gets: a short hello, the latest issue, and three
// places to start. Sent once per subscriber (welcomed_at), right after they're active.

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
const abs = (src: string) => (src.startsWith("/") ? `${SITE_URL}${src}` : src);

function html(opts: { latest: Piece | null; start: Piece[]; unsub: string }) {
  const { latest, start, unsub } = opts;
  const issue = latest
    ? `<div style="margin:0 0 26px;border:2px solid #22262b;background:#ffffff">
${latest.cover?.src ? `<img src="${abs(latest.cover.src)}" alt="" width="100%" style="display:block;border-bottom:2px solid #22262b">` : ""}
<div style="padding:18px 20px">
<p style="margin:0 0 6px;font-size:13px;font-weight:700;color:#c8102e">${latest.issue_number ? `Issue #${latest.issue_number}` : "The latest issue"}</p>
<p style="margin:0 0 6px;font-size:21px;font-weight:800;line-height:1.25">${esc(latest.title)}</p>
${latest.subtitle ? `<p style="margin:0 0 16px;font-size:16px;line-height:1.5;color:#3d434a">${esc(latest.subtitle)}</p>` : ""}
<a href="${SITE_URL}${pieceUrl(latest)}" style="display:inline-block;background:#c8102e;color:#f7faf4;text-decoration:none;font-weight:700;padding:12px 22px;border-radius:999px">Read the latest issue</a>
</div></div>`
    : "";
  const list = start
    .map(
      (p) => `<tr><td style="padding:12px 0;border-top:1.5px solid #a9bba0">
<a href="${SITE_URL}${pieceUrl(p)}" style="color:#22262b;text-decoration:none"><span style="font-size:12px;font-weight:700;color:#555c63">${PIECE_TYPE_LABEL[p.type]} · ${p.reading_minutes} min</span><br><strong style="font-size:17px">${esc(p.title)}</strong></a>
</td></tr>`,
    )
    .join("");
  return `<!doctype html><html><body style="margin:0;padding:24px;background:#e8efe2;font-family:Segoe UI,Helvetica,Arial,sans-serif;color:#22262b">
<div style="max-width:560px;margin:0 auto;background:#f7faf4;border:2px solid #22262b;padding:28px">
<p style="font-size:22px;font-weight:800;margin:0 0 18px">think<span style="color:#c8102e">in</span>products</p>
<p style="font-size:22px;font-weight:800;margin:0 0 10px">You're in. Welcome to the notebook.</p>
<p style="font-size:16px;line-height:1.6;margin:0 0 12px">Hi, I'm Madan. Every week I send one email: a new piece on how product managers think, a practical tip, and links to what's new on the site.</p>
<p style="font-size:16px;line-height:1.6;margin:0 0 22px">Most pieces ask you to <strong>make the call first</strong>, then show how a PM would think it through. It's the fastest way I know to build product sense.</p>
${issue}
${list ? `<p style="font-size:17px;font-weight:800;margin:0 0 4px">Good places to start</p><table role="presentation" width="100%" cellpadding="0" cellspacing="0">${list}</table>` : ""}
<p style="font-size:16px;line-height:1.6;margin:22px 0 0">Hit reply and tell me what you're working on, or what you'd like me to write about. I read every reply.</p>
<p style="font-size:16px;margin:8px 0 0">Madan</p>
<p style="font-size:12px;color:#555c63;margin:26px 0 0">You're getting this because you subscribed at thinkinproducts.com. <a href="${unsub}" style="color:#555c63">Unsubscribe</a></p>
</div></body></html>`;
}

// Safe to call more than once: only the first call for an address sends.
export async function sendWelcome(email: string) {
  const db = serviceClient();
  const resend = getResend();
  if (!db || !resend) return;
  const addr = email.toLowerCase();
  // Claim the welcome first, so two quick calls can't both send it.
  const { data: claimed } = await db
    .from("subscribers")
    .update({ welcomed_at: new Date().toISOString() })
    .eq("email", addr)
    .eq("status", "active")
    .is("welcomed_at", null)
    .select("unsubscribe_token")
    .maybeSingle();
  if (!claimed) return;

  const pieces = await listPieces({ status: "published" });
  const latest = pieces.filter((p) => p.type === "newsletter").sort((a, b) => (b.published_at ?? "").localeCompare(a.published_at ?? ""))[0] ?? null;
  const pick = (t: Piece["type"]) => pieces.filter((p) => p.type === t).sort((a, b) => Number(b.featured) - Number(a.featured))[0];
  const start = [pick("article"), pick("case_study"), pick("breakdown")].filter(Boolean) as Piece[];
  const unsub = `${SITE_URL}/unsubscribe?token=${claimed.unsubscribe_token}`;

  const { error } = await resend.emails.send({
    from: FROM,
    to: addr,
    replyTo: process.env.INBOX_NOTIFY_EMAIL || undefined,
    subject: "Welcome to ThinkInProducts",
    html: html({ latest, start, unsub }),
    headers: { "List-Unsubscribe": `<${unsub}>`, "List-Unsubscribe-Post": "List-Unsubscribe=One-Click" },
  });
  // If sending failed, let a later attempt try again.
  if (error) await db.from("subscribers").update({ welcomed_at: null }).eq("email", addr);
}
