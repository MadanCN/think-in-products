import { Resend } from "resend";

if (!process.env.RESEND_API_KEY) {
  console.warn(
    "[resend] RESEND_API_KEY is not set — email sends will be skipped. Set it in .env.local to enable."
  );
}

export const resend = new Resend(process.env.RESEND_API_KEY ?? "re_placeholder");

// Supports FROM_EMAIL (per spec) and RESEND_FROM_EMAIL (legacy) env vars
export const FROM_EMAIL =
  process.env.FROM_EMAIL ??
  process.env.RESEND_FROM_EMAIL ??
  "hello@thinkinproducts.com";
