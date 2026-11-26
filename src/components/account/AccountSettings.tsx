"use client";

import { useState } from "react";
import { loadMe } from "./useMe";

async function call(url: string, method: string, body: unknown) {
  const res = await fetch(url, { method, headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error ?? "Couldn't save. Try again.");
  return data;
}

function Toggle({ label, help, on, onChange }: { label: string; help: string; on: boolean; onChange: (v: boolean) => Promise<void> }) {
  const [v, setV] = useState(on);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  return (
    <div className="toggle-row">
      <div>
        <strong>{label}</strong>
        <p className="small" style={{ margin: "2px 0 0" }}>{help}</p>
        {err ? <p className="form-error">{err}</p> : null}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={v}
        aria-label={label}
        className={`switch${v ? " on" : ""}`}
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          setErr("");
          try {
            await onChange(!v);
            setV(!v);
          } catch (e) {
            setErr((e as Error).message);
          }
          setBusy(false);
        }}
      >
        <span />
      </button>
    </div>
  );
}

export function AccountSettings({ name, bio, notifyReplies, newsletterOn, email }: { name: string; bio: string; notifyReplies: boolean; newsletterOn: boolean; email: string }) {
  const [n, setN] = useState(name);
  const [b, setB] = useState(bio);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState("");
  const [delErr, setDelErr] = useState("");

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    try {
      await call("/api/me", "PATCH", { name: n, bio: b });
      await loadMe(true);
      setMsg({ ok: true, text: "Saved." });
    } catch (e) {
      setMsg({ ok: false, text: (e as Error).message });
    }
    setBusy(false);
  }

  return (
    <div className="settings-grid">
      <form onSubmit={save} className="settings-card">
        <h3>Profile</h3>
        <label className="lbl" htmlFor="pf-name">Name <span className="small">(shown with your comments)</span></label>
        <input id="pf-name" className="field" value={n} maxLength={60} onChange={(e) => setN(e.target.value)} required />
        <label className="lbl" htmlFor="pf-bio">About you <span className="small">(optional, {280 - b.length} left)</span></label>
        <textarea id="pf-bio" className="field" rows={3} maxLength={280} value={b} placeholder="e.g. Product executive in Bengaluru, moving into PM" onChange={(e) => setB(e.target.value)} />
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 14 }}>
          <button className="btn btn-sm btn-dark" disabled={busy}>{busy ? "Saving..." : "Save profile"}</button>
          {msg ? <span className={msg.ok ? "small" : "form-error"} role="status">{msg.text}</span> : null}
        </div>
      </form>

      <div className="settings-card">
        <h3>Email</h3>
        <p className="small" style={{ margin: "0 0 10px" }}>Sent to {email}</p>
        <Toggle label="The weekly newsletter" help="One email a week with new pieces and a practical tip." on={newsletterOn} onChange={(on) => call("/api/me/newsletter", "POST", { on })} />
        <Toggle label="Replies to my comments" help="An email when someone replies to you." on={notifyReplies} onChange={(v) => call("/api/me", "PATCH", { notifyReplies: v })} />
      </div>

      <div className="settings-card">
        <h3>Account</h3>
        <form action="/auth/logout" method="post" style={{ marginBottom: 18 }}>
          <button className="btn btn-sm" type="submit">Log out</button>
        </form>
        <details>
          <summary className="small" style={{ cursor: "pointer" }}>Delete my account</summary>
          <p className="small">This removes your profile, reading history, comments and likes for good. Type DELETE to confirm.</p>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <input className="field" style={{ maxWidth: 160 }} value={confirm} onChange={(e) => setConfirm(e.target.value)} aria-label="Type DELETE to confirm" />
            <button
              type="button"
              className="btn btn-sm btn-red"
              disabled={confirm !== "DELETE"}
              onClick={async () => {
                try {
                  await call("/api/me", "DELETE", { confirm });
                  await fetch("/auth/logout", { method: "POST" }).catch(() => null);
                  window.location.replace("/");
                } catch (e) {
                  setDelErr((e as Error).message);
                }
              }}
            >
              Delete forever
            </button>
          </div>
          {delErr ? <p className="form-error">{delErr}</p> : null}
        </details>
      </div>
    </div>
  );
}
