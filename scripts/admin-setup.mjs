#!/usr/bin/env node
// Sets up the admin login: email, password and two-factor codes.
// Run it from the project folder:  npm run admin:setup
// It writes ADMIN_EMAIL, ADMIN_PASSWORD_HASH, ADMIN_TOTP_SECRET and AUTH_SECRET to .env.local.
// For the live site, copy the same four values into your host's environment variables.

import { createHmac, randomBytes, scryptSync } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { createInterface } from "node:readline";

const ENV = ".env.local";
const rl = createInterface({ input: process.stdin, output: process.stdout, terminal: true });
let muted = false;
rl._writeToOutput = (s) => {
  if (!muted) rl.output.write(s);
  else if (s.includes("\n")) rl.output.write("\n");
};
const ask = (q, hidden = false) =>
  new Promise((resolve) => {
    rl.question(q, (a) => {
      muted = false;
      resolve(a.trim());
    });
    muted = hidden;
  });

const B32 = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
function base32(buf) {
  let bits = 0, value = 0, out = "";
  for (const b of buf) {
    value = (value << 8) | b;
    bits += 8;
    while (bits >= 5) {
      out += B32[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) out += B32[(value << (5 - bits)) & 31];
  return out;
}
function base32Decode(s) {
  let bits = 0, value = 0;
  const out = [];
  for (const c of s) {
    value = (value << 5) | B32.indexOf(c);
    bits += 5;
    if (bits >= 8) {
      out.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }
  return Buffer.from(out);
}
function totp(secret, step) {
  const msg = Buffer.alloc(8);
  msg.writeBigUInt64BE(BigInt(step));
  const h = createHmac("sha1", base32Decode(secret)).update(msg).digest();
  const o = h[h.length - 1] & 15;
  return String(((h.readUInt32BE(o) & 0x7fffffff) % 1_000_000)).padStart(6, "0");
}

function readEnv() {
  return existsSync(ENV) ? readFileSync(ENV, "utf8") : "";
}
function setEnv(text, key, value) {
  const line = `${key}=${value}`;
  const re = new RegExp(`^${key}=.*$`, "m");
  return re.test(text) ? text.replace(re, line) : `${text}${text && !text.endsWith("\n") ? "\n" : ""}${line}\n`;
}

console.log("\nThinkInProducts admin setup\n");
const email = (await ask("Admin email: ")).toLowerCase();
if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
  console.error("That email doesn't look right.");
  process.exit(1);
}
let password = "";
for (;;) {
  password = await ask("Password (at least 12 characters, it won't show as you type): ", true);
  if (password.length < 12) {
    console.log("Too short. Use at least 12 characters; a few random words works well.");
    continue;
  }
  const again = await ask("Type it again: ", true);
  if (again === password) break;
  console.log("Those didn't match. Try again.");
}

const N = 16384, r = 8, p = 1;
const salt = randomBytes(16);
const hash = scryptSync(password, salt, 64, { N, r, p, maxmem: 64 * 1024 * 1024 });
const passwordHash = `scrypt:${N}:${r}:${p}:${salt.toString("base64url")}:${hash.toString("base64url")}`;

const secret = base32(randomBytes(20));
const label = encodeURIComponent(`ThinkInProducts:${email}`);
const url = `otpauth://totp/${label}?secret=${secret}&issuer=ThinkInProducts&algorithm=SHA1&digits=6&period=30`;

console.log("\nScan this with an authenticator app (Google Authenticator, Microsoft Authenticator, 1Password...):\n");
// The QR code needs the "qrcode" package (installed by `npm install`). Without it,
// the key below can be typed into the app by hand instead.
try {
  const QRCode = (await import("qrcode")).default;
  console.log(await QRCode.toString(url, { type: "terminal", small: true }));
} catch {
  console.log("(Can't draw the QR code: run `npm install` first, or add the key below by hand.)\n");
}
console.log(`Can't scan? Add it by hand with this key: ${secret.match(/.{1,4}/g).join(" ")}\n`);

for (let tries = 0; ; tries++) {
  const code = (await ask("Enter the 6-digit code the app shows: ")).replace(/\s/g, "");
  const step = Math.floor(Date.now() / 30000);
  if ([0, -1, 1].some((d) => totp(secret, step + d) === code)) break;
  if (tries >= 4) {
    console.error("Still not matching. Check your phone's clock is set automatically, then run setup again.");
    process.exit(1);
  }
  console.log("That code didn't match. Wait for the next one and try again.");
}

let env = readEnv();
env = setEnv(env, "ADMIN_EMAIL", email);
env = setEnv(env, "ADMIN_PASSWORD_HASH", passwordHash);
env = setEnv(env, "ADMIN_TOTP_SECRET", secret);
if (!/^AUTH_SECRET=.{32,}$/m.test(env)) env = setEnv(env, "AUTH_SECRET", randomBytes(48).toString("base64url"));
writeFileSync(ENV, env);
rl.close();

console.log(`\nDone. Saved to ${ENV}. Restart \`npm run dev\`, then sign in at /admin.`);
console.log("For the live site, add the same ADMIN_EMAIL, ADMIN_PASSWORD_HASH, ADMIN_TOTP_SECRET and AUTH_SECRET to your host's environment variables.\n");
