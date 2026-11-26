"use client";

import "./admin.css";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { LogoMark } from "@/components/Logo";
import { SECTION_LIST } from "@/lib/types";

const ICONS: Record<string, React.ReactNode> = {
  dash: <path d="M4 13h6V4H4zM14 20h6v-9h-6zM4 20h6v-4H4zM14 4v4h6V4z" />,
  article: <path d="M6 4h12v16H6zM9 8h6M9 12h6M9 16h4" />,
  case_study: <path d="M4 7h16v12H4zM9 7V5h6v2M4 12h16" />,
  breakdown: <path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5L18 18M6 18l2.5-2.5M15.5 8.5L18 6" />,
  newsletter: <path d="M3 6h18v12H3zM3 6l9 7 9-7" />,
  inbox: <path d="M3 13l3-8h12l3 8v6H3zM3 13h5l1 3h6l1-3h5" />,
  authors: <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21c1-4 4-6 8-6s7 2 8 6" />,
};

async function signOut(reason?: string) {
  await fetch("/api/admin/logout", { method: "POST" }).catch(() => null);
  window.location.replace(`/admin/login${reason ? `?ended=${reason}` : ""}`);
}

// Warns two minutes before an idle session ends, and signs out when it does.
function IdleGuard({ idleMinutes }: { idleMinutes: number }) {
  const lastActive = useRef(0);
  const lastPing = useRef(0);
  const [warn, setWarn] = useState(false);

  const ping = useCallback(async () => {
    lastPing.current = Date.now();
    const res = await fetch("/api/admin/session", { method: "POST" }).catch(() => null);
    if (res && res.status === 401) {
      const data = await res.json().catch(() => ({}));
      window.location.replace(`/admin/login?ended=${data.reason === "expired" ? "expired" : "idle"}`);
    }
  }, []);

  useEffect(() => {
    lastActive.current = Date.now();
    lastPing.current = Date.now();
    const onActivity = () => {
      lastActive.current = Date.now();
      // Typing in the editor doesn't always hit the server, so tell it we're here.
      if (Date.now() - lastPing.current > 2 * 60_000) void ping();
    };
    const events = ["keydown", "pointerdown", "wheel", "touchstart"] as const;
    events.forEach((e) => window.addEventListener(e, onActivity, { passive: true }));
    const timer = setInterval(() => {
      const idle = Date.now() - lastActive.current;
      const limit = idleMinutes * 60_000;
      if (idle >= limit) void signOut("idle");
      else setWarn(idle >= limit - 2 * 60_000);
    }, 10_000);
    return () => {
      events.forEach((e) => window.removeEventListener(e, onActivity));
      clearInterval(timer);
    };
  }, [idleMinutes, ping]);

  if (!warn) return null;
  return (
    <div className="modal-back">
      <div className="modal" role="alertdialog" aria-modal="true" aria-label="Still there?">
        <h2>Still there?</h2>
        <p style={{ margin: "8px 0 22px" }}>You&apos;ll be signed out in about 2 minutes because nothing has happened for a while. Save your work if you&apos;re stepping away.</p>
        <div className="row" style={{ justifyContent: "flex-end" }}>
          <button type="button" className="btn btn-sm" onClick={() => signOut()}>Sign out now</button>
          <button
            type="button"
            className="btn btn-sm btn-dark"
            autoFocus
            onClick={() => {
              lastActive.current = Date.now();
              setWarn(false);
              void ping();
            }}
          >
            Stay signed in
          </button>
        </div>
      </div>
    </div>
  );
}

export function AdminShell({ children, local, unread = 0, idleMinutes = 30 }: { children: React.ReactNode; local: boolean; unread?: number; idleMinutes?: number }) {
  const path = usePathname();
  const items = [
    { href: "/admin", label: "Dashboard", icon: "dash" },
    ...SECTION_LIST.map((s) => ({ href: s.adminPath, label: s.type === "newsletter" ? "Newsletters" : s.plural, icon: s.type as string })),
    { href: "/admin/inbox", label: "Inbox", icon: "inbox", badge: unread },
    { href: "/admin/authors", label: "Authors", icon: "authors" },
  ];
  return (
    <div className="admin shell">
      <aside className="side" aria-label="Admin">
        <Link href="/admin" className="side-logo" aria-label="Admin home"><LogoMark height={22} tone="light" /></Link>
        <nav>
          {items.map((it) => {
            const on = it.href === "/admin" ? path === "/admin" : path.startsWith(it.href);
            return (
              <Link key={it.href} href={it.href} className={on ? "on" : undefined} aria-current={on ? "page" : undefined}>
                <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{ICONS[it.icon]}</svg>
                {it.label}
                {"badge" in it && it.badge ? <span className="side-badge" aria-label={`${it.badge} new`}>{it.badge}</span> : null}
              </Link>
            );
          })}
        </nav>
        <div className="side-foot">
          {local ? <span className="pill" style={{ background: "var(--highlighter)", color: "var(--graphite)" }}>Local mode</span> : null}
          <a href="/" target="_blank" rel="noopener">View site ↗</a>
          <button type="button" className="linkbtn" style={{ color: "var(--on-dark-2)", alignSelf: "flex-start" }} onClick={() => signOut()}>Sign out</button>
        </div>
      </aside>
      <div className="shell-main">{children}</div>
      <IdleGuard idleMinutes={idleMinutes} />
    </div>
  );
}
