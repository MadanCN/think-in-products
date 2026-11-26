import { NextResponse } from "next/server";
import { sameOrigin } from "@/lib/admin-auth";
import { PENDING_COOKIE, PENDING_MAX_AGE, adminConfigured, cookieOptions, newPending } from "@/lib/security/admin-session";
import { safeEqual } from "@/lib/security/crypto";
import { verifyPassword } from "@/lib/security/password";
import { clientIp, rateLimit, resetLimit } from "@/lib/security/rate-limit";

// Step 1 of 2: email and password. On success the browser gets a short-lived cookie
// that only allows step 2 (the 6-digit code).
export async function POST(request: Request) {
  if (!sameOrigin(request)) return NextResponse.json({ error: "Blocked." }, { status: 403 });
  if (!adminConfigured()) return NextResponse.json({ error: "The admin login isn't set up yet. Run `npm run admin:setup`." }, { status: 503 });
  const ip = clientIp(request);
  const limit = rateLimit(`login:${ip}`, 5, 15 * 60_000);
  const global = rateLimit("login:all", 50, 15 * 60_000);
  if (!limit.ok || !global.ok) {
    return NextResponse.json({ error: `Too many attempts. Try again in ${Math.ceil(Math.max(limit.retryAfter, global.retryAfter) / 60)} minutes.` }, { status: 429 });
  }
  const body = await request.json().catch(() => ({}));
  const email = String(body.email ?? "").trim().toLowerCase().slice(0, 200);
  const password = String(body.password ?? "").slice(0, 200);
  // Always check the password, even for a wrong email, so timing reveals nothing.
  const passOk = await verifyPassword(password, process.env.ADMIN_PASSWORD_HASH ?? "");
  const emailOk = safeEqual(email, (process.env.ADMIN_EMAIL ?? "").trim().toLowerCase());
  if (!passOk || !emailOk) return NextResponse.json({ error: "That email and password don't match." }, { status: 401 });
  resetLimit(`login:${ip}`);
  const { token } = await newPending();
  const res = NextResponse.json({ next: "code" });
  res.cookies.set(PENDING_COOKIE, token, cookieOptions(PENDING_MAX_AGE));
  return res;
}
