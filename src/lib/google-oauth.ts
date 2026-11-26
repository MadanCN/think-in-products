import "server-only";
import { b64url, sign, unsign } from "./security/crypto";

// Supabase checks the token's nonce against the SHA-256 of ours, as hex.
async function sha256Hex(s: string) {
  const d = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return [...new Uint8Array(d)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

// Google sign-in that runs through thinkinproducts.com, so Google's screen says
// "Sign in to thinkinproducts.com". Google sends the reader back here; we swap the code
// for an ID token and hand that to Supabase, which creates the session.

export const GOOGLE_STATE_COOKIE = "tip_google";
export const googleConfigured = () => Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);

type State = { state: string; nonce: string; next: string; newsletter: boolean; exp: number };

const random = () => b64url(crypto.getRandomValues(new Uint8Array(24)));

export async function startGoogle(origin: string, next: string, newsletter: boolean) {
  const s: State = { state: random(), nonce: random(), next, newsletter, exp: Date.now() + 10 * 60_000 };
  const hashedNonce = await sha256Hex(s.nonce);
  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.search = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID!,
    redirect_uri: `${origin}/auth/google/callback`,
    response_type: "code",
    scope: "openid email profile",
    state: s.state,
    nonce: hashedNonce,
    prompt: "select_account",
  }).toString();
  return { url: url.toString(), cookie: await sign(s) };
}

export async function readState(cookie: string | undefined, state: string | null): Promise<State | null> {
  if (!cookie || !state) return null;
  const s = await unsign<State>(cookie);
  return s && s.state === state && s.exp > Date.now() ? s : null;
}

export async function exchangeCode(origin: string, code: string): Promise<string | null> {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: `${origin}/auth/google/callback`,
      grant_type: "authorization_code",
    }),
  });
  if (!res.ok) return null;
  const data = (await res.json()) as { id_token?: string };
  return data.id_token ?? null;
}
