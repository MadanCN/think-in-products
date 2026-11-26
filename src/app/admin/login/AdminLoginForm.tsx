"use client";

import { useRef, useState } from "react";
import "@/components/admin/admin.css";

export function AdminLoginForm({ next }: { next: string }) {
  const [step, setStep] = useState<"password" | "code">("password");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const codeRef = useRef<HTMLInputElement>(null);

  async function post(url: string, body: unknown) {
    const res = await fetch(url, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
    return { res, data: await res.json().catch(() => ({})) };
  }

  async function submitPassword(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setBusy(true);
    setError("");
    const { res, data } = await post("/api/admin/login", { email: f.get("email"), password: f.get("password") });
    setBusy(false);
    if (!res.ok) return setError(data.error ?? "Couldn't sign in.");
    setStep("code");
    setTimeout(() => codeRef.current?.focus(), 0);
  }

  async function submitCode(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setBusy(true);
    setError("");
    const { res, data } = await post("/api/admin/login/verify", { code: f.get("code") });
    setBusy(false);
    if (res.ok) return window.location.assign(next);
    setError(data.error ?? "That code didn't work.");
    if (data.restart) setStep("password");
  }

  return step === "password" ? (
    <form key="password" onSubmit={submitPassword} className="stack" style={{ gap: 14 }}>
      <label>
        <span className="label">Email</span>
        <input className="field" name="email" type="email" autoComplete="username" required autoFocus />
      </label>
      <label>
        <span className="label">Password</span>
        <input className="field" name="password" type="password" autoComplete="current-password" required />
      </label>
      {error ? <p className="form-error" role="alert">{error}</p> : null}
      <button className="btn btn-dark" disabled={busy}>{busy ? "Checking..." : "Continue"}</button>
    </form>
  ) : (
    <form key="code" onSubmit={submitCode} className="stack" style={{ gap: 14 }}>
      <p style={{ margin: 0 }}>Open your authenticator app and enter the 6-digit code for ThinkInProducts.</p>
      <label>
        <span className="label">Code</span>
        <input ref={codeRef} className="field code-field" name="code" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9 ]{6,7}" maxLength={7} required />
      </label>
      {error ? <p className="form-error" role="alert">{error}</p> : null}
      <button className="btn btn-dark" disabled={busy}>{busy ? "Checking..." : "Sign in"}</button>
      <button type="button" className="linkbtn" style={{ alignSelf: "flex-start" }} onClick={() => { setStep("password"); setError(""); }}>Use a different account</button>
    </form>
  );
}
