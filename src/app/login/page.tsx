import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/Logo";
import { redirect } from "next/navigation";
import { getReader } from "@/lib/reader";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = { title: "Log in" };

const REASONS = [
  { box: "Your calls are saved", sub: "B, C, B, A...", note: "See how your thinking changes over time.", pen: "#1f3fbf", bg: "var(--sheet)" },
  { box: "Plus and Pro pieces", sub: "Full archive, case studies", note: "Your plan unlocks the moment you log in.", pen: "#c8102e", bg: "var(--highlighter)" },
  { box: "One email a week", sub: "The newsletter, nothing else", note: "Unsubscribe in one click, any time.", pen: "#1f3fbf", bg: "var(--sheet)" },
];

export default async function LoginPage(props: PageProps<"/login">) {
  const sp = await props.searchParams;
  const raw = typeof sp.next === "string" ? sp.next : "/account";
  const next = raw.startsWith("/") && !raw.startsWith("//") && !raw.startsWith("/login") ? raw : "/account";
  if (await getReader()) redirect(next);
  const ERRORS: Record<string, string> = {
    cancelled: "Google sign-in was cancelled. Try again whenever you're ready.",
    expired: "That sign-in took too long. Try again.",
    google: "Google sign-in didn't work. Try again, or use your email.",
    link: "That login link has expired or was already used. Ask for a new one.",
    setup: "Login isn't switched on yet.",
  };
  const error = typeof sp.error === "string" ? ERRORS[sp.error] ?? null : null;
  const mode = sp.mode === "signup" ? "signup" : "login";
  return (
    <>
      <header className="site-header">
        <div className="wrap site-header-inner">
          <Logo />
          <Link href="/" className="back-link">← Back to the notebook</Link>
        </div>
      </header>
      <main id="main" className="wrap" style={{ paddingTop: 32, paddingBottom: 96, display: "flex", flexWrap: "wrap-reverse", gap: "48px 72px", alignItems: "center", maxWidth: 1180 }}>
        <div style={{ flex: "1 1 420px", minWidth: 0 }}>
          <h1 className="display" style={{ fontSize: "clamp(44px, 5vw, 72px)", lineHeight: 0.95, marginBottom: 14 }}>Welcome to the notebook.</h1>
          <p className="lead" style={{ margin: "0 0 32px", maxWidth: 460 }}>You don&apos;t need an account to read the free issues. You need one to keep your progress and unlock paid pieces.</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 18, maxWidth: 540 }}>
            {REASONS.map((r) => (
              <div key={r.box} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ flex: "0 0 210px", background: r.bg, border: "2px solid var(--graphite)", borderRadius: 12, padding: "10px 14px", fontSize: 15 }}>
                  <strong>{r.box}</strong>
                  <br />
                  {r.sub}
                </div>
                <svg aria-hidden="true" width="44" height="20" viewBox="0 0 44 20" fill="none" stroke={r.pen} strokeWidth="3" strokeLinecap="round" style={{ flex: "0 0 44px" }}>
                  <path d="M42 12 C30 6, 16 6, 4 10 M4 10 l10 -7 M4 10 l11 5" />
                </svg>
                <p className="hand" style={{ margin: 0, fontSize: 20, lineHeight: 1.3, color: r.pen }}>{r.note}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="taped" style={{ flex: "0 1 460px", minWidth: 0, padding: "clamp(24px, 3.4vw, 40px)" }}>
          <LoginForm next={next} initialMode={mode} error={error} />
        </div>
      </main>
    </>
  );
}
