import { sign, unsign } from "./crypto";

// The admin signs in with email + password + a 6-digit code from an authenticator app.
// The session lives in a signed, HttpOnly cookie that expires after a stretch of
// inactivity (ADMIN_IDLE_MINUTES, default 30) or a fixed time after login
// (ADMIN_MAX_HOURS, default 12), whichever comes first.

const prod = process.env.NODE_ENV === "production";
export const SESSION_COOKIE = prod ? "__Host-tip_admin" : "tip_admin";
export const PENDING_COOKIE = prod ? "__Host-tip_admin_2fa" : "tip_admin_2fa";

export const IDLE_MS = Math.max(5, Number(process.env.ADMIN_IDLE_MINUTES) || 30) * 60_000;
export const MAX_MS = Math.max(1, Number(process.env.ADMIN_MAX_HOURS) || 12) * 3_600_000;
const PENDING_MS = 5 * 60_000;
// Change ADMIN_SESSION_VERSION to sign out every session at once.
const VERSION = process.env.ADMIN_SESSION_VERSION || "1";

type Session = { k: "admin"; v: string; sid: string; iat: number; last: number };
type Pending = { k: "2fa"; v: string; pid: string; iat: number };

export function adminConfigured() {
  return Boolean(process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD_HASH && process.env.ADMIN_TOTP_SECRET);
}

export function cookieOptions(maxAgeMs: number) {
  return { httpOnly: true, secure: prod, sameSite: "strict" as const, path: "/", maxAge: Math.floor(maxAgeMs / 1000) };
}

export async function newSession(): Promise<string> {
  const now = Date.now();
  return sign({ k: "admin", v: VERSION, sid: crypto.randomUUID(), iat: now, last: now } satisfies Session);
}

export type SessionCheck = { ok: false; reason: "missing" | "invalid" | "idle" | "expired" } | { ok: true; expiresAt: number; refreshed: string | null };

// Checks the cookie. When valid and the last refresh is over a minute old, returns a
// refreshed token so activity keeps the session alive.
export async function checkSession(token: string | undefined, touch = true): Promise<SessionCheck> {
  if (!token) return { ok: false, reason: "missing" };
  let s: Session | null = null;
  try {
    s = await unsign<Session>(token);
  } catch {
    return { ok: false, reason: "invalid" };
  }
  if (!s || s.k !== "admin" || s.v !== VERSION) return { ok: false, reason: "invalid" };
  const now = Date.now();
  if (now - s.iat > MAX_MS) return { ok: false, reason: "expired" };
  if (now - s.last > IDLE_MS) return { ok: false, reason: "idle" };
  const refreshed = touch && now - s.last > 60_000 ? await sign({ ...s, last: now }) : null;
  const last = refreshed ? now : s.last;
  return { ok: true, expiresAt: Math.min(last + IDLE_MS, s.iat + MAX_MS), refreshed };
}

export async function newPending(): Promise<{ token: string; pid: string }> {
  const pid = crypto.randomUUID();
  return { token: await sign({ k: "2fa", v: VERSION, pid, iat: Date.now() } satisfies Pending), pid };
}

export async function checkPending(token: string | undefined): Promise<string | null> {
  const p = token ? await unsign<Pending>(token).catch(() => null) : null;
  if (!p || p.k !== "2fa" || p.v !== VERSION || Date.now() - p.iat > PENDING_MS) return null;
  return p.pid;
}

export const PENDING_MAX_AGE = PENDING_MS;

// Cookies named __Host-... can only be removed by a cookie with the same Secure/path
// settings, so clearing goes through here.
export function clearCookie(res: { cookies: { set: (name: string, value: string, opts: ReturnType<typeof cookieOptions>) => unknown } }, name: string) {
  res.cookies.set(name, "", { ...cookieOptions(0), maxAge: 0 });
}
