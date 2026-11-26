import { NextResponse, after } from "next/server";
import { sendWelcome } from "@/lib/email/welcome";
import { createAdminClient } from "@/lib/supabase/server";

// The link in the confirmation email. Turns the subscription on, then sends the welcome.
export async function GET(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token") ?? "";
  const db = createAdminClient();
  if (db && /^[0-9a-f-]{36}$/i.test(token)) {
    const { data } = await db
      .from("subscribers")
      .update({ status: "active", confirmed_at: new Date().toISOString() })
      .eq("confirm_token", token)
      .neq("status", "unsubscribed")
      .select("email")
      .maybeSingle();
    if (data?.email) after(() => sendWelcome(data.email));
  }
  return NextResponse.redirect(new URL("/welcome", url.origin));
}
