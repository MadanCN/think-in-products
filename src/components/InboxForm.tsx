"use client";

import Script from "next/script";
import { useState } from "react";

type Kind = "contact" | "pitch";

declare global {
  interface Window {
    turnstile?: { reset: (el?: string) => void };
  }
}

// The contact form and the "write for us" form. Spam checks happen on the server;
// the hidden "website" field catches bots that fill in every box.
export function InboxForm({ kind, token, turnstileKey }: { kind: Kind; token: string; turnstileKey: string }) {
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries()) as Record<string, unknown>;
    data.consent = data.consent === "on";
    data.turnstile = data["cf-turnstile-response"];
    delete data["cf-turnstile-response"];
    setState("sending");
    setError("");
    const res = await fetch(`/api/forms/${kind}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ ...data, token }) }).catch(() => null);
    const out = res ? await res.json().catch(() => ({})) : {};
    if (res?.ok) {
      setState("sent");
      return;
    }
    setState("idle");
    setError(out.error ?? "Couldn't send. Check your connection and try again.");
    window.turnstile?.reset();
  }

  if (state === "sent") {
    return (
      <div className="form-done" role="status">
        <p className="hand red" style={{ fontSize: 26, margin: "0 0 6px" }}>got it, thank you</p>
        <h2>{kind === "pitch" ? "Your pitch is in." : "Your message is on its way."}</h2>
        <p>{kind === "pitch" ? "I read every pitch and reply by email, usually within a week. If it's a fit, we'll plan the piece together." : "I read every message and reply by email, usually within a few days."}</p>
      </div>
    );
  }

  return (
    <form className="inbox-form" onSubmit={submit} noValidate={false}>
      {turnstileKey ? <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer /> : null}
      <div className="form-grid">
        <label>
          <span className="label">Your name</span>
          <input className="field" name="name" autoComplete="name" required maxLength={120} />
        </label>
        <label>
          <span className="label">Email</span>
          <input className="field" name="email" type="email" autoComplete="email" required maxLength={200} />
        </label>
        {kind === "pitch" ? (
          <>
            <label>
              <span className="label">Phone</span>
              <input className="field" name="phone" type="tel" autoComplete="tel" required maxLength={40} placeholder="+91 98765 43210" />
            </label>
            <label>
              <span className="label">What would you like to write?</span>
              <select className="field" name="piece_type" required defaultValue="">
                <option value="" disabled>Choose one</option>
                <option value="article">An article</option>
                <option value="case_study">A case study</option>
                <option value="breakdown">A product breakdown</option>
              </select>
            </label>
          </>
        ) : null}
      </div>
      <label>
        <span className="label">{kind === "pitch" ? "Working title" : "What's it about? (optional)"}</span>
        <input className="field" name="subject" required={kind === "pitch"} maxLength={200} placeholder={kind === "pitch" ? "e.g. Why Swiggy shows delivery time before price" : "e.g. A question about the Netflix case study"} />
      </label>
      <label>
        <span className="label">{kind === "pitch" ? "Tell us briefly what you want to publish" : "Your message"}</span>
        <textarea
          className="field"
          name="message"
          required
          minLength={kind === "pitch" ? 40 : 10}
          maxLength={5000}
          rows={kind === "pitch" ? 7 : 6}
          placeholder={kind === "pitch" ? "The idea in two or three sentences, what readers will learn, and why you're the one to write it." : undefined}
        />
      </label>
      {kind === "pitch" ? (
        <>
          <label>
            <span className="label">A link to something you&apos;ve written (optional)</span>
            <input className="field" name="link" type="url" maxLength={500} placeholder="https://" />
          </label>
          <label className="consent">
            <input type="checkbox" name="consent" required />
            <span>
              I agree that ThinkInProducts can store these details to review my pitch and contact me about it by email or phone. If my piece is published, it appears under my name. See the <a href="/privacy" target="_blank">privacy page</a>.
            </span>
          </label>
        </>
      ) : null}
      {/* For bots only. Hidden from people and screen readers. */}
      <div className="hp" aria-hidden="true">
        <label>
          Website
          <input name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>
      {turnstileKey ? <div className="cf-turnstile" data-sitekey={turnstileKey} data-theme="light" /> : null}
      {error ? <p className="form-error" role="alert">{error}</p> : null}
      <button className="btn btn-dark" disabled={state === "sending"} style={{ alignSelf: "flex-start" }}>
        {state === "sending" ? "Sending..." : kind === "pitch" ? "Send my pitch" : "Send message"}
      </button>
    </form>
  );
}
