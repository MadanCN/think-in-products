import { NextResponse } from "next/server";
import { optInAtSignIn } from "@/lib/reader";
import { createClient } from "@/lib/supabase/server";

// Google sign-in, login links and email confirmations all land here.
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const rawNext = url.searchParams.get("next") ?? "/account";
  const next = rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : "/";
  const supabase = await createClient();
  if (code && supabase) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // Ticked "send me the newsletter" (Google fallback, login links, or at sign-up).
      const u = data.user;
      if (u && (url.searchParams.get("newsletter") === "1" || u.user_metadata?.newsletter === true)) await optInAtSignIn(u.id, u.email ?? "").catch(() => null);
      return NextResponse.redirect(new URL(next, url.origin));
    }
  }
  return NextResponse.redirect(new URL("/login?error=link", url.origin));
}
