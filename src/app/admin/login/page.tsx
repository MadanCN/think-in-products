import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LogoMark } from "@/components/Logo";
import { isAdmin } from "@/lib/admin-auth";
import { adminConfigured } from "@/lib/security/admin-session";
import { AdminLoginForm } from "./AdminLoginForm";

export const metadata: Metadata = { title: "Sign in" };

export default async function AdminLogin(props: PageProps<"/admin/login">) {
  const sp = await props.searchParams;
  const next = typeof sp.next === "string" && sp.next.startsWith("/admin") && !sp.next.startsWith("//") ? sp.next : "/admin";
  if (await isAdmin()) redirect(next);
  const ended = sp.ended === "idle" ? "You were signed out after a period of inactivity." : sp.ended === "expired" ? "Your session reached its time limit. Sign in again." : "";
  return (
    <main className="admin-login">
      <div className="admin-login-card">
        <LogoMark height={30} />
        <h1>Admin sign in</h1>
        {ended ? <p className="admin-login-note" role="status">{ended}</p> : null}
        {adminConfigured() ? (
          <AdminLoginForm next={next} />
        ) : (
          <div className="stack" style={{ gap: 10 }}>
            <p style={{ margin: 0 }}>The admin login isn&apos;t set up yet. In the project folder, run:</p>
            <pre className="admin-login-code">npm run admin:setup</pre>
            <p style={{ margin: 0 }}>It asks for your email and a password, shows a QR code for your authenticator app, and saves everything to <code>.env.local</code>. Then restart <code>npm run dev</code>.</p>
          </div>
        )}
      </div>
    </main>
  );
}
