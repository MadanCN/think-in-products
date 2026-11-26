import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { sameOrigin } from "@/lib/admin-auth";
import { IDLE_MS, MAX_MS, SESSION_COOKIE, checkSession, cookieOptions } from "@/lib/security/admin-session";

// GET: when does this session end? POST: "I'm still here", keeps it alive.
async function handle(request: Request, touch: boolean) {
  if (!sameOrigin(request)) return NextResponse.json({ error: "Blocked." }, { status: 403 });
  const store = await cookies();
  const check = await checkSession(store.get(SESSION_COOKIE)?.value, touch);
  if (!check.ok) return NextResponse.json({ ok: false, reason: check.reason }, { status: 401 });
  const res = NextResponse.json({ ok: true, expiresAt: check.expiresAt, idleMinutes: IDLE_MS / 60_000 });
  if (check.refreshed) res.cookies.set(SESSION_COOKIE, check.refreshed, cookieOptions(Math.min(IDLE_MS * 4, MAX_MS)));
  return res;
}

export const GET = (request: Request) => handle(request, false);
export const POST = (request: Request) => handle(request, true);
