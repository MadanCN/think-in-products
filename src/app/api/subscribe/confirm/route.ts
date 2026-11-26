import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token") ?? "";
  const db = createAdminClient();
  if (db && /^[0-9a-f-]{36}$/i.test(token)) {
    await db.from("subscribers").update({ status: "active", confirmed_at: new Date().toISOString() }).eq("confirm_token", token);
  }
  return NextResponse.redirect(new URL("/welcome", url.origin));
}
