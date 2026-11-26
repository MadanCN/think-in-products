import { hmacSha1Raw } from "./crypto";

// Time-based one-time codes (RFC 6238), the 6-digit codes from Google Authenticator,
// Microsoft Authenticator, 1Password and similar apps.

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

export function base32Decode(input: string): Uint8Array<ArrayBuffer> {
  const clean = input.toUpperCase().replace(/[^A-Z2-7]/g, "");
  const out: number[] = [];
  let bits = 0;
  let value = 0;
  for (const c of clean) {
    value = (value << 5) | ALPHABET.indexOf(c);
    bits += 5;
    if (bits >= 8) {
      out.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }
  const arr = new Uint8Array(new ArrayBuffer(out.length));
  arr.set(out);
  return arr;
}

async function codeAt(key: Uint8Array<ArrayBuffer>, step: number): Promise<string> {
  const msg = new Uint8Array(new ArrayBuffer(8));
  let s = step;
  for (let i = 7; i >= 0; i--) {
    msg[i] = s & 255;
    s = Math.floor(s / 256);
  }
  const h = await hmacSha1Raw(key, msg);
  const o = h[h.length - 1] & 15;
  const n = ((h[o] & 127) << 24) | (h[o + 1] << 16) | (h[o + 2] << 8) | h[o + 3];
  return String(n % 1_000_000).padStart(6, "0");
}

// Returns the time step the code matched (allowing one step of clock drift), or null.
export async function verifyTotp(secret: string, code: string, now = Date.now()): Promise<number | null> {
  const clean = code.replace(/\s/g, "");
  if (!/^\d{6}$/.test(clean)) return null;
  const key = base32Decode(secret);
  if (key.length < 10) return null;
  const step = Math.floor(now / 30_000);
  for (const d of [0, -1, 1]) {
    if ((await codeAt(key, step + d)) === clean) return step + d;
  }
  return null;
}
