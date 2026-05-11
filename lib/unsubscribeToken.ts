import { createHmac, timingSafeEqual } from "crypto";

function secret(): string {
  const s =
    process.env.RESEND_API_KEY ??
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    "dev-unsubscribe-secret";
  return s;
}

export function generateUnsubscribeToken(email: string): string {
  return createHmac("sha256", secret())
    .update(email.toLowerCase().trim())
    .digest("hex");
}

export function verifyUnsubscribeToken(email: string, token: string): boolean {
  try {
    const expected = generateUnsubscribeToken(email);
    const a = Buffer.from(expected, "utf8");
    const b = Buffer.from(token, "utf8");
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}
