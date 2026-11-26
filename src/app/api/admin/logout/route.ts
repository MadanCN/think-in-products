import { NextResponse } from "next/server";
import { sameOrigin } from "@/lib/admin-auth";
import { PENDING_COOKIE, SESSION_COOKIE, clearCookie } from "@/lib/security/admin-session";

export async function POST(request: Request) {
  if (!sameOrigin(request)) return NextResponse.json({ error: "Blocked." }, { status: 403 });
  const res = NextResponse.json({ ok: true });
  clearCookie(res, SESSION_COOKIE);
  clearCookie(res, PENDING_COOKIE);
  return res;
}
