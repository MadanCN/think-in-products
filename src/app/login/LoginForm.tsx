"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function LoginForm({ next }: { next: string }) {
  const supabase = createClient();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [newsletter, setNewsletter] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const callback = `${origin}/auth/callback?next=${encodeURIComponent(next)}`;

  if (!supabase) {
    return (
      <p style={{ margin: 0 }}>
        Login turns on once Supabase is connected. Add your keys to <code>.env.local</code> (see the README) and restart the dev server.
      </p>
    );
  }

  async function google() {
    setBusy(true);
    const { error } = await supabase!.auth.signInWithOAuth({ provider: "google", options: { redirectTo: callback } });
    if (error) {
      setMsg({ kind: "err", text: error.message });
      setBusy(false);
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    if (mode === "login") {
      const { error } = await supabase!.auth.signInWithPassword({ email, password });
      if (error) setMsg({ kind: "err", text: "That email and password don't match. Try again, or use a login link." });
      else window.location.href = next;
    } else {
      const { error } = await supabase!.auth.signUp({ email, password, options: { data: { name }, emailRedirectTo: callback } });
      if (error) setMsg({ kind: "err", text: error.message });
      else {
        if (newsletter) {
          await fetch("/api/subscribe", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email, source: "signup" }) });
        }
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

      {/* Replace with Google's official button asset before launch (Google branding rules). */}
      <button type="button" className="btn" onClick={google} disabled={busy} style={{ width: "100%", background: "var(--white)" }}>
        <span aria-hidden="true" style={{ width: 26, height: 26, borderRadius: "50%", border: "2px solid var(--graphite)", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 15, fontWeight: 800 }}>G</span>
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
        {mode === "signup" ? (
          <label style={{ display: "flex", gap: 10, alignItems: "flex-start", fontSize: 15, cursor: "pointer" }}>
            <input type="checkbox" checked={newsletter} onChange={(e) => setNewsletter(e.target.checked)} style={{ width: 20, height: 20, margin: "2px 0 0", accentColor: "var(--red)" }} />
            Send me the weekly issue (you can change this any time)
          </label>
        ) : null}
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
