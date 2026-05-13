import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Creates an SSR-aware Supabase client that reads the user's auth session from
 * cookies. Use this in Route Handlers (/api) to verify the logged-in user.
 * setAll is intentionally a no-op because Route Handlers cannot set cookies
 * mid-response.
 */
export function createSessionClient() {
  const cookieStore = cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll() {},
      },
    }
  );
}
