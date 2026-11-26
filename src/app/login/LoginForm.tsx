"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function LoginForm({ next, initialMode = "login", error = null }: { next: string; initialMode?: "login" | "signup"; error?: string | null }) {
  const supabase = createClient();
  const [mode, setMode] = useState<"login" | "signup">(initialMode);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [newsletter, setNewsletter] = useState(true);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(error ? { kind: "err", text: error } : null);

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const callback = `${origin}/auth/callback?next=${encodeURIComponent(next)}${newsletter ? "&newsletter=1" : ""}`;

  if (!supabase) {
    return (
      <p style={{ margin: 0 }}>
        Login turns on once Supabase is connected. Add your keys to <code>.env.local</code> (see the README) and restart the dev server.
      </p>
    );
  }

  // Runs through our own domain, so Google shows "thinkinproducts.com".
  function google() {
    setBusy(true);
    window.location.assign(`${window.location.origin}/auth/google?next=${encodeURIComponent(next)}${newsletter ? "&newsletter=1" : ""}`);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    if (mode === "login") {
      const { error } = await supabase!.auth.signInWithPassword({ email, password });
      if (error) setMsg({ kind: "err", text: "That email and password don't match. Try again, or use a login link." });
      else {
        if (newsletter) await fetch("/api/me/optin", { method: "POST" }).catch(() => null);
        window.location.href = next;
      }
    } else {
      const { error } = await supabase!.auth.signUp({ email, password, options: { data: { name, newsletter }, emailRedirectTo: callback } });
      if (error) setMsg({ kind: "err", text: error.message });
      else {
        setMsg({ kind: "ok", text: "Account created. Check your inbox to confirm your email, then log in." });
      }
    }
    setBusy(false);
  }

  async function magicLink() {
    if (!email) {
      setMsg({ kind: "err", text: "Type your email first, then ask for a login link." });
      return;
    }
    setBusy(true);
    const { error } = await supabase!.auth.signInWithOtp({ email, options: { emailRedirectTo: callback } });
    setMsg(error ? { kind: "err", text: error.message } : { kind: "ok", text: "Login link sent. Check your inbox." });
    setBusy(false);
  }

  const tab = (on: boolean): React.CSSProperties => ({
    flex: 1,
    minHeight: 44,
    font: "inherit",
    fontSize: 16,
    fontWeight: 700,
    border: 0,
    borderRadius: 999,
    cursor: "pointer",
    background: on ? "var(--graphite)" : "transparent",
    color: on ? "var(--sheet)" : "var(--graphite)",
  });

  return (
    <div>
      <div role="group" aria-label="Log in or create account" style={{ display: "flex", border: "2px solid var(--graphite)", borderRadius: 999, padding: 4, marginBottom: 24 }}>
        <button type="button" aria-pressed={mode === "login"} style={tab(mode === "login")} onClick={() => setMode("login")}>Log in</button>
        <button type="button" aria-pressed={mode === "signup"} style={tab(mode === "signup")} onClick={() => setMode("signup")}>Create account</button>
      </div>

      <label className="nl-check">
        <input type="checkbox" checked={newsletter} onChange={(e) => setNewsletter(e.target.checked)} />
        <span>Send me the weekly newsletter. <span className="small">One email a week, unsubscribe any time.</span></span>
      </label>

      {/* Google's "G" mark in its official colours, as Google's sign-in branding guidelines allow. */}
      <button type="button" className="btn" onClick={google} disabled={busy} style={{ width: "100%", background: "var(--white)", gap: 12 }}>
        <svg aria-hidden="true" width="20" height="20" viewBox="0 0 48 48">
          <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
          <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
          <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
          <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
        </svg>
        Continue with Google
      </button>

      <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "22px 0", color: "var(--ink-3)", fontSize: 14 }}>
        <span style={{ flex: 1, borderTop: "1.5px solid var(--rule)" }} />or with email<span style={{ flex: 1, borderTop: "1.5px solid var(--rule)" }} />
      </div>

      <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {mode === "signup" ? (
          <div>
            <label className="label" htmlFor="f-name">Name</label>
            <input id="f-name" className="field" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="What should we call you?" style={{ minHeight: 50 }} />
          </div>
        ) : null}
        <div>
          <label className="label" htmlFor="f-email">Email</label>
          <input id="f-email" className="field" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@email.com" style={{ minHeight: 50 }} />
        </div>
        <div>
          <label className="label" htmlFor="f-pass">Password</label>
          <input
            id="f-pass"
            className="field"
            type="password"
            required
            minLength={8}
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={mode === "login" ? "Your password" : "At least 8 characters"}
            style={{ minHeight: 50 }}
          />
        </div>
        <button className="btn btn-red" type="submit" disabled={busy}>{mode === "login" ? "Log in" : "Create account"}</button>
      </form>

      {msg ? (
        <p role={msg.kind === "err" ? "alert" : "status"} style={{ margin: "16px 0 0", color: msg.kind === "err" ? "var(--red)" : "var(--blue)", fontWeight: 600 }}>{msg.text}</p>
      ) : null}
      <p style={{ margin: "18px 0 0", fontSize: 14, color: "var(--ink-3)", textAlign: "center" }}>
        Prefer not to use a password?{" "}
        <button type="button" onClick={magicLink} disabled={busy} style={{ font: "inherit", color: "var(--blue)", background: "none", border: 0, padding: 0, textDecoration: "underline", cursor: "pointer" }}>
          Email me a login link
        </button>
      </p>
    </div>
  );
}
