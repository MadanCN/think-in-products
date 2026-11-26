import { createServerClient } from "@supabase/ssr";
import { createClient as createPlainClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { SUPABASE_ANON_KEY, SUPABASE_URL, isSupabaseConfigured } from "./env";

// Client for server components and route handlers, acting as the logged-in reader.
export async function createClient() {
  if (!isSupabaseConfigured) return null;
  const cookieStore = await cookies();
  return createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(toSet) {
        try {
          toSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Called from a server component: the proxy refreshes the session instead.
        }
      },
    },
  });
}

// Service-role client for trusted server work (subscriber list, sending email).
// Never import this into client code.
export function createAdminClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!isSupabaseConfigured || !key) return null;
  return createPlainClient(SUPABASE_URL, key, { auth: { persistSession: false } });
}

export type Viewer = { id: string; email: string | null; isAdmin: boolean; plan: "free" | "plus" | "pro" } | null;

export async function getViewer(): Promise<Viewer> {
  const supabase = await createClient();
  if (!supabase) return null;
  const { data } = await supabase.auth.getUser();
  const user = data.user;
  if (!user) return null;
  const [{ data: profile }, { data: membership }] = await Promise.all([
    supabase.from("profiles").select("role").eq("id", user.id).maybeSingle(),
    supabase
      .from("memberships")
      .select("plan, status")
      .eq("user_id", user.id)
      .eq("status", "active")
      .maybeSingle(),
  ]);
  return {
    id: user.id,
    email: user.email ?? null,
    isAdmin: profile?.role === "admin",
    plan: (membership?.plan as "plus" | "pro" | undefined) ?? "free",
  };
}

// In local mode (no Supabase yet) the admin is open, but only while developing.
export async function canUseAdmin(): Promise<boolean> {
  if (!isSupabaseConfigured) return process.env.NODE_ENV !== "production";
  const viewer = await getViewer();
  return Boolean(viewer?.isAdmin);
}
