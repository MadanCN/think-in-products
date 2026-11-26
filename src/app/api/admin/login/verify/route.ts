import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { sameOrigin } from "@/lib/admin-auth";
import { IDLE_MS, MAX_MS, PENDING_COOKIE, SESSION_COOKIE, checkPending, cookieOptions, newSession, clearCookie } from "@/lib/security/admin-session";
import { clientIp, rateLimit } from "@/lib/security/rate-limit";
import { verifyTotp } from "@/lib/security/totp";

declare global {
  var __tipUsedSteps: Map<number, number> | undefined;
}
// Each code works once, even inside its 30-second window.
const used = (globalThis.__tipUsedSteps ??= new Map<number, number>());

// Step 2 of 2: the 6-digit code from the authenticator app.
export async function POST(request: Request) {
  if (!sameOrigin(request)) return NextResponse.json({ error: "Blocked." }, { status: 403 });
  const store = await cookies();
  const pid = await checkPending(store.get(PENDING_COOKIE)?.value);
  if (!pid) return NextResponse.json({ error: "That took too long. Enter your password again.", restart: true }, { status: 401 });
  const perLogin = rateLimit(`2fa:${pid}`, 5, 5 * 60_000);
  const perIp = rateLimit(`2fa-ip:${clientIp(request)}`, 10, 15 * 60_000);
  if (!perLogin.ok || !perIp.ok) {
    const res = NextResponse.json({ error: "Too many wrong codes. Start again in a few minutes.", restart: true }, { status: 429 });
    clearCookie(res, PENDING_COOKIE);
    return res;
  }
  const body = await request.json().catch(() => ({}));
  const step = await verifyTotp(process.env.ADMIN_TOTP_SECRET ?? "", String(body.code ?? ""));
  if (step === null || used.has(step)) return NextResponse.json({ error: "That code didn't work. Check your authenticator app and try the newest code." }, { status: 401 });
  used.set(step, Date.now());
  for (const [s, t] of used) if (Date.now() - t > 5 * 60_000) used.delete(s);

  const res = NextResponse.json({ ok: true });
  clearCookie(res, PENDING_COOKIE);
  res.cookies.set(SESSION_COOKIE, await newSession(), cookieOptions(Math.min(IDLE_MS * 4, MAX_MS)));
  return res;
}
