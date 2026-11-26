"use client";

import { useId, useState } from "react";

export function SubscribeForm({ cta = "Subscribe free", source = "site", dark = false }: { cta?: string; source?: string; dark?: boolean }) {
  const id = useId();
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [message, setMessage] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setState("sending");
    const res = await fetch("/api/subscribe", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email, source }),
    }).catch(() => null);
    const data = res ? await res.json().catch(() => ({})) : {};
    if (res?.ok) {
      setState("done");
      setMessage(data.message ?? "Check your inbox and click the link to confirm.");
    } else {
      setState("error");
      setMessage(data.error ?? "That didn't go through. Check the email address and try again.");
    }
  }

  if (state === "done") {
    return (
      <p role="status" className="hand" style={{ fontSize: 22, margin: 0, color: dark ? "var(--highlighter)" : "var(--blue)" }}>
        {message}
      </p>
    );
  }

  return (
    <form onSubmit={submit} style={{ display: "flex", flexWrap: "wrap", gap: 10, width: "100%" }}>
      <label htmlFor={id} className="sr-only">Email address</label>
      <input
        id={id}
        className="input"
        type="email"
        required
        autoComplete="email"
        placeholder="you@email.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        style={{ flex: "1 1 240px", width: "auto", minHeight: 56 }}
      />
      <button className="btn btn-red" type="submit" disabled={state === "sending"} style={{ minHeight: 56 }}>
        {state === "sending" ? "Subscribing..." : cta}
      </button>
      {state === "error" ? <p role="alert" style={{ flexBasis: "100%", margin: 0, color: "var(--red)", fontSize: 15 }}>{message}</p> : null}
    </form>
  );
}
