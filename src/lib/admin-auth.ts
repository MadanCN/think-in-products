import "server-only";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { SESSION_COOKIE, checkSession } from "./security/admin-session";

// Server-side check for admin pages and API routes. The proxy checks first; this is the
// second lock on the door, so a mistake in one place doesn't open the admin.
export async function isAdmin(): Promise<boolean> {
  const store = await cookies();
  return (await checkSession(store.get(SESSION_COOKIE)?.value, false)).ok;
}

// Same-origin check for requests that change things, against cross-site request forgery.
export function sameOrigin(request: Request): boolean {
  if (["GET", "HEAD", "OPTIONS"].includes(request.method)) return true;
  const origin = request.headers.get("origin");
  if (!origin) return request.headers.get("sec-fetch-site") === "same-origin";
  try {
    return new URL(origin).host === (request.headers.get("x-forwarded-host") ?? request.headers.get("host"));
  } catch {
    return false;
  }
}

// Returns an error response if the caller isn't the signed-in admin, else null.
export async function denyUnlessAdmin(request?: Request) {
  if (request && !sameOrigin(request)) return NextResponse.json({ error: "Blocked: request came from another site." }, { status: 403 });
  if (await isAdmin()) return null;
  return NextResponse.json({ error: "Your session ended. Sign in again." }, { status: 401 });
}
