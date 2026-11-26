import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { GOOGLE_STATE_COOKIE, exchangeCode, readState } from "@/lib/google-oauth";
import { optInAtSignIn } from "@/lib/reader";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const origin = url.origin;
  const store = await cookies();
  const fail = (why: string) => {
    const res = NextResponse.redirect(new URL(`/login?error=${why}`, origin));
    res.cookies.set(GOOGLE_STATE_COOKIE, "", { path: "/auth/google", maxAge: 0 });
    return res;
  };

  if (url.searchParams.get("error")) return fail("cancelled");
  const s = await readState(store.get(GOOGLE_STATE_COOKIE)?.value, url.searchParams.get("state"));
  const code = url.searchParams.get("code");
  if (!s || !code) return fail("expired");

  const idToken = await exchangeCode(origin, code);
  if (!idToken) return fail("google");

  const supabase = await createClient();
  if (!supabase) return fail("setup");
  const { data, error } = await supabase.auth.signInWithIdToken({ provider: "google", token: idToken, nonce: s.nonce });
  if (error) {
    console.error("google sign-in", error.message);
    return fail("google");
  }
  if (s.newsletter && data.user) await optInAtSignIn(data.user.id, data.user.email ?? "").catch(() => null);
  const res = NextResponse.redirect(new URL(s.next, origin));
  res.cookies.set(GOOGLE_STATE_COOKIE, "", { path: "/auth/google", maxAge: 0 });
  return res;
}
