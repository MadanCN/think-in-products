"use client";

import { useState } from "react";
import { Mail, ArrowRight, Loader2, CheckCircle2 } from "lucide-react";

export function ArticleSubscribeCTA() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setState("loading");
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), source: "article" }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Something went wrong.");
      setState("success");
      setMessage("You're in! Check your inbox for a welcome email.");
    } catch (err) {
      setState("error");
      setMessage((err as Error).message);
    }
  }

  return (
    <div className="my-16 rounded-3xl border border-border bg-bg-card p-8 md:p-10 text-center">
      <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-accent-primary/10 border border-accent-primary/20 mb-5">
        <Mail className="w-5 h-5 text-accent-primary" />
      </div>

      <h3 className="font-display text-xl font-bold text-text-primary mb-2">
        Enjoyed this? Get more in your inbox.
      </h3>
      <p className="text-text-muted text-sm leading-relaxed mb-7 max-w-sm mx-auto">
        Product thinking articles, frameworks, and teardowns — no spam, unsubscribe any time.
      </p>

      {state === "success" ? (
        <div className="flex items-center justify-center gap-2 text-emerald-400 font-mono text-sm">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          {message}
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex gap-2 max-w-sm mx-auto">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            required
            className="flex-1 px-4 py-2.5 rounded-xl bg-bg-secondary border border-border text-text-primary placeholder:text-text-muted text-sm outline-none focus:border-accent-primary/50 transition-colors"
          />
          <button
            type="submit"
            disabled={state === "loading"}
            className="px-4 py-2.5 rounded-xl bg-accent-primary text-bg-primary font-semibold text-sm hover:bg-accent-primary/90 transition-colors disabled:opacity-60 flex items-center gap-1.5 shrink-0"
          >
            {state === "loading" ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <ArrowRight className="w-4 h-4" />
            )}
          </button>
        </form>
      )}

      {state === "error" && (
        <p className="text-rose-400 font-mono text-xs mt-3">{message}</p>
      )}
    </div>
  );
}
