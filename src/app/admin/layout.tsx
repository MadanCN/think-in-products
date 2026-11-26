import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { AdminShell } from "@/components/admin/AdminShell";
import { isAdmin } from "@/lib/admin-auth";
import { listInbox } from "@/lib/repo";
import { unseenCommentCount } from "@/lib/reader";
import { IDLE_MS } from "@/lib/security/admin-session";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export const metadata: Metadata = { title: { default: "Admin", template: "%s · Admin" }, robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

// Pages shown without the admin sidebar. The proxy passes the path along.
const BARE = ["/admin/login", "/admin/preview"];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const path = (await headers()).get("x-admin-path") ?? "";
  if (BARE.includes(path)) return children;
  // The proxy already checked the session; this is the second lock.
  if (!(await isAdmin())) redirect("/admin/login");
  const [inbox, comments] = await Promise.all([listInbox({ status: "new" }).catch(() => []), unseenCommentCount().catch(() => 0)]);
  return <AdminShell local={!isSupabaseConfigured} unread={inbox.length} comments={comments} idleMinutes={IDLE_MS / 60_000}>{children}</AdminShell>;
}
