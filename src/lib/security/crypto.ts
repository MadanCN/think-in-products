// Small Web Crypto helpers. They run anywhere Next.js runs (the proxy, route handlers,
// server components), so the same code signs and checks cookies everywhere.

const enc = new TextEncoder();

export function b64url(bytes: ArrayBuffer | Uint8Array): string {
  const arr = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let s = "";
  for (const b of arr) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function fromB64url(s: string): Uint8Array<ArrayBuffer> {
  const b = atob(s.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((s.length + 3) % 4));
  const out = new Uint8Array(new ArrayBuffer(b.length));
  for (let i = 0; i < b.length; i++) out[i] = b.charCodeAt(i);
  return out;
}

// Constant-time comparison, so attackers can't learn a secret one character at a time.
export function safeEqual(a: string, b: string): boolean {
  const x = enc.encode(a);
  const y = enc.encode(b);
  let diff = x.length ^ y.length;
  for (let i = 0; i < Math.max(x.length, y.length); i++) diff |= (x[i] ?? 0) ^ (y[i] ?? 0);
  return diff === 0;
}

declare global {
  var __tipDevSecret: string | undefined;
}

// AUTH_SECRET signs admin sessions and form tokens. Required in production.
export function authSecret(): string {
  const s = process.env.AUTH_SECRET;
  if (s && s.length >= 32) return s;
  if (process.env.NODE_ENV === "production") throw new Error("Set AUTH_SECRET (at least 32 characters). Run `npm run admin:setup` to make one.");
  // Development without a secret: a random one per server start. Sessions end on restart.
  globalThis.__tipDevSecret ??= b64url(crypto.getRandomValues(new Uint8Array(32)));
  return globalThis.__tipDevSecret;
}

const keyCache = new Map<string, Promise<CryptoKey>>();
function hmacKey(secret: string, hash: "SHA-256" | "SHA-1" = "SHA-256", raw?: Uint8Array<ArrayBuffer>) {
  const id = `${hash}:${raw ? b64url(raw) : secret}`;
  let k = keyCache.get(id);
  if (!k) {
    k = crypto.subtle.importKey("raw", raw ?? enc.encode(secret), { name: "HMAC", hash }, false, ["sign"]);
    keyCache.set(id, k);
  }
  return k;
}

export async function hmac(data: string, secret = authSecret()): Promise<string> {
  return b64url(await crypto.subtle.sign("HMAC", await hmacKey(secret), enc.encode(data)));
}

export async function hmacSha1Raw(key: Uint8Array<ArrayBuffer>, data: Uint8Array<ArrayBuffer>): Promise<Uint8Array> {
  return new Uint8Array(await crypto.subtle.sign("HMAC", await hmacKey("", "SHA-1", key), data));
}

// "payload.signature", where payload is base64url JSON.
export async function sign(obj: unknown): Promise<string> {
  const body = b64url(enc.encode(JSON.stringify(obj)));
  return `${body}.${await hmac(body)}`;
}

export async function unsign<T>(token: string | undefined | null): Promise<T | null> {
  if (!token) return null;
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;
  if (!safeEqual(sig, await hmac(body))) return null;
  try {
    return JSON.parse(new TextDecoder().decode(fromB64url(body))) as T;
  } catch {
    return null;
  }
}

export async function sha256(data: string): Promise<string> {
  return b64url(await crypto.subtle.digest("SHA-256", enc.encode(data)));
}
