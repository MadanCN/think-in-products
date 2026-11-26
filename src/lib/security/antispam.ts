import "server-only";
import { authSecret, sha256, sign, unsign } from "./crypto";

// Layers that stop bots without bothering people:
// 1. A hidden "website" field. People never see it; bots fill it in.
// 2. A signed form token with the time the form was shown. Sent too fast (under 3 s)
//    or too late (over 2 h), or forged, and it's rejected.
// 3. Limits per address: in memory, and in the stored inbox so they survive restarts.
// 4. Content checks: too many links, link markup, or the same text over and over.
// 5. Optional Cloudflare Turnstile, when TURNSTILE_SECRET_KEY is set.

export const HONEYPOT = "website";

export async function formToken(form: string): Promise<string> {
  return sign({ f: form, t: Date.now() });
}

export async function checkFormToken(token: unknown, form: string): Promise<string | null> {
  const data = await unsign<{ f: string; t: number }>(typeof token === "string" ? token : null).catch(() => null);
  if (!data || data.f !== form) return "The form expired. Reload the page and try again.";
  const age = Date.now() - data.t;
  if (age < 3000) return "That was very fast. Wait a moment and send again.";
  if (age > 2 * 3_600_000) return "The form expired. Reload the page and try again.";
  return null;
}

export function looksLikeSpam(text: string): boolean {
  const links = text.match(/https?:\/\/|www\./gi)?.length ?? 0;
  if (links > 3) return true;
  if (/\[url=|<a\s+href|\[link=/i.test(text)) return true;
  if (/(.)\1{14,}/.test(text)) return true;
  return false;
}

// Store a hash of the address, not the address itself.
export async function hashIp(ip: string): Promise<string> {
  return (await sha256(`${ip}:${authSecret()}`)).slice(0, 32);
}

export const turnstileSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? "";

export async function checkTurnstile(token: unknown, ip: string): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return true;
  if (typeof token !== "string" || !token) return false;
  const body = new URLSearchParams({ secret, response: token, remoteip: ip });
  const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", { method: "POST", body }).catch(() => null);
  const data = res ? ((await res.json().catch(() => ({}))) as { success?: boolean }) : {};
  return Boolean(data.success);
}
