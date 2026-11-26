import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { IDLE_MS, MAX_MS, SESSION_COOKIE, checkSession, cookieOptions, clearCookie } from "@/lib/security/admin-session";

// Open without a session: the login page and the login steps themselves.
const PUBLIC_ADMIN = ["/admin/login", "/api/admin/login", "/api/admin/login/verify", "/api/admin/logout"];

function adminHeaders(res: NextResponse) {
  res.headers.set("Cache-Control", "no-store, max-age=0");
  res.headers.set("X-Robots-Tag", "noindex, nofollow");
  return res;
}

// 1. Guards the admin: every /admin page and /api/admin route needs a valid session.
//    Activity keeps the session alive; idle or too-old sessions are sent to the login.
// 2. Keeps the readers' Supabase login fresh.
export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const isAdminArea = pathname === "/admin" || pathname.startsWith("/admin/") || pathname.startsWith("/api/admin/");

  if (isAdminArea) {
    // Tell the admin layout which page this is (login and preview have no sidebar).
    // Set here, so a browser can't fake it.
    const forwarded = new Headers(request.headers);
    forwarded.set("x-admin-path", pathname);
    if (PUBLIC_ADMIN.includes(pathname)) return adminHeaders(NextResponse.next({ request: { headers: forwarded } }));
    const check = await checkSession(request.cookies.get(SESSION_COOKIE)?.value);
    if (!check.ok) {
      if (pathname.startsWith("/api/")) {
        return adminHeaders(NextResponse.json({ error: "Your session ended. Sign in again.", reason: check.reason }, { status: 401 }));
      }
      const url = request.nextUrl.clone();
      url.pathname = "/admin/login";
      url.search = "";
      url.searchParams.set("next", pathname + search);
      if (check.reason === "idle" || check.reason === "expired") url.searchParams.set("ended", check.reason);
      const res = NextResponse.redirect(url);
      if (check.reason !== "missing") clearCookie(res, SESSION_COOKIE);
      return adminHeaders(res);
    }
    const res = NextResponse.next({ request: { headers: forwarded } });
    if (check.refreshed) res.cookies.set(SESSION_COOKIE, check.refreshed, cookieOptions(Math.min(IDLE_MS * 4, MAX_MS)));
    return adminHeaders(res);
  }

  let response = NextResponse.next({ request });
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return response;

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(toSet) {
        toSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        toSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });
  await supabase.auth.getUser();
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|images|brand|uploads|favicon.ico|icon.svg|apple-icon.png).*)"],
};
