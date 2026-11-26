import "server-only";
import { FROM, getResend } from "./email/send";
import { SITE_URL } from "./supabase/env";

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

function shell(title: string, body: string, cta: { href: string; label: string }) {
  return `<!doctype html><html><body style="margin:0;padding:24px;background:#e8efe2;font-family:Segoe UI,Helvetica,Arial,sans-serif;color:#22262b">
<div style="max-width:560px;margin:0 auto;background:#f7faf4;border:2px solid #22262b;padding:28px">
<p style="font-size:22px;font-weight:800;margin:0 0 16px">think<span style="color:#c8102e">in</span>products</p>
<p style="font-size:20px;font-weight:700;margin:0 0 12px">${title}</p>
${body}
<a href="${cta.href}" style="display:inline-block;background:#c8102e;color:#f7faf4;text-decoration:none;font-weight:700;padding:12px 24px;border-radius:999px">${cta.label}</a>
<p style="font-size:13px;color:#555c63;margin:22px 0 0">You can turn off reply emails on <a href="${SITE_URL}/account#settings" style="color:#555c63">your profile</a>.</p>
</div></body></html>`;
}

const quote = (text: string) =>
  `<blockquote style="margin:0 0 22px;padding:12px 16px;border-left:4px solid #ffe95c;background:#ffffff;font-size:16px;line-height:1.5;white-space:pre-wrap">${esc(text.slice(0, 1200))}</blockquote>`;

export async function sendReplyEmail(to: string, opts: { replierName: string; pieceTitle: string; pieceUrl: string; commentId: string; text: string }) {
  const resend = getResend();
  if (!resend) return;
  const href = `${SITE_URL}${opts.pieceUrl}#comment-${opts.commentId}`;
  await resend.emails
    .send({
      from: FROM,
      to,
      subject: `${opts.replierName} replied to you on "${opts.pieceTitle}"`,
      html: shell(`${esc(opts.replierName)} replied to your comment`, `<p style="font-size:15px;margin:0 0 10px">On <strong>${esc(opts.pieceTitle)}</strong>:</p>${quote(opts.text)}`, { href, label: "See the discussion" }),
      text: `${opts.replierName} replied to your comment on "${opts.pieceTitle}":\n\n${opts.text}\n\n${href}`,
    })
    .catch(() => null);
}

export async function notifyAdminOfComment(opts: { name: string; pieceTitle: string; text: string }) {
  const to = process.env.INBOX_NOTIFY_EMAIL;
  const resend = getResend();
  if (!to || !resend) return;
  await resend.emails
    .send({ from: FROM, to, subject: `New comment on "${opts.pieceTitle}"`, text: `${opts.name} wrote:\n\n${opts.text}\n\nModerate or reply: ${SITE_URL}/admin/comments` })
    .catch(() => null);
}
