import { NextResponse } from "next/server";
import { GOOGLE_STATE_COOKIE, googleConfigured, startGoogle } from "@/lib/google-oauth";
import { createClient } from "@/lib/supabase/server";

const safeNext = (raw: string | null) => (raw && raw.startsWith("/") && !raw.startsWith("//") ? raw : "/account");

export async function GET(request: Request) {
  const url = new URL(request.url);
  const next = safeNext(url.searchParams.get("next"));
  const origin = url.origin;

  if (googleConfigured()) {
    const { url: to, cookie } = await startGoogle(origin, next, url.searchParams.get("newsletter") === "1");
    const res = NextResponse.redirect(to);
    res.cookies.set(GOOGLE_STATE_COOKIE, cookie, { httpOnly: true, secure: origin.startsWith("https"), sameSite: "lax", path: "/auth/google", maxAge: 600 });
    return res;
  }

  // Fallback: Supabase's own Google flow (Google then shows the Supabase address).
  const supabase = await createClient();
  if (!supabase) return NextResponse.redirect(new URL("/login?error=setup", origin));
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: `${origin}/auth/callback?next=${encodeURIComponent(next)}${url.searchParams.get("newsletter") === "1" ? "&newsletter=1" : ""}`, skipBrowserRedirect: true },
  });
  if (error || !data.url) return NextResponse.redirect(new URL("/login?error=google", origin));
  return NextResponse.redirect(data.url);
}
