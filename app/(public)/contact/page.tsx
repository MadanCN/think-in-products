"use client";

import { useState } from "react";
import { Badge } from "@/components/ui";
import { Button } from "@/components/ui";
import { Mail, Send, CheckCircle2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export default function ContactPage() {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    setErrorMsg("");

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error ?? "Something went wrong.");
        setStatus("error");
      } else {
        setStatus("success");
        setForm({ name: "", email: "", message: "" });
      }
    } catch {
      setErrorMsg("Network error — please try again.");
      setStatus("error");
    }
  }

  return (
    <div className="min-h-screen pt-32 pb-24 px-6">
      <div className="max-w-2xl mx-auto">

        {/* Header */}
        <div className="mb-12 space-y-4">
          <Badge variant="outline" className="font-mono text-accent-primary border-accent-primary/30">
            Contact
          </Badge>
          <h1 className="font-display text-4xl md:text-5xl font-bold text-text-primary">
            Get in touch
          </h1>
          <p className="text-text-secondary text-lg leading-relaxed">
            Have a question, a collaboration idea, or just want to say hello? Drop a message and I&rsquo;ll get back to you.
          </p>
        </div>

        {/* Success state */}
        {status === "success" ? (
          <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-8 flex flex-col items-center gap-4 text-center">
            <CheckCircle2 className="w-10 h-10 text-emerald-400" />
            <h2 className="font-display text-xl font-bold text-text-primary">Message sent!</h2>
            <p className="text-text-secondary text-sm">
              Thanks for reaching out. I&rsquo;ll reply as soon as I can.
            </p>
            <Button variant="ghost" onClick={() => setStatus("idle")} className="mt-2">
              Send another
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label className="font-mono text-xs text-text-muted uppercase tracking-wider">
                  Your name
                </label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="Madan C N"
                  className="w-full px-4 py-3 rounded-xl bg-bg-card border border-border text-text-primary placeholder:text-text-muted text-sm outline-none focus:border-accent-primary/50 transition-colors"
                />
              </div>
              <div className="space-y-1.5">
                <label className="font-mono text-xs text-text-muted uppercase tracking-wider">
                  Your email
                </label>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  placeholder="you@example.com"
                  className="w-full px-4 py-3 rounded-xl bg-bg-card border border-border text-text-primary placeholder:text-text-muted text-sm outline-none focus:border-accent-primary/50 transition-colors"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="font-mono text-xs text-text-muted uppercase tracking-wider">
                Message
              </label>
              <textarea
                required
                rows={6}
                value={form.message}
                onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                placeholder="What's on your mind?"
                maxLength={2000}
                className="w-full px-4 py-3 rounded-xl bg-bg-card border border-border text-text-primary placeholder:text-text-muted text-sm outline-none focus:border-accent-primary/50 transition-colors resize-none"
              />
              <p className={cn("text-right font-mono text-xs", form.message.length > 1800 ? "text-amber-400" : "text-text-muted")}>
                {form.message.length}/2000
              </p>
            </div>

            {status === "error" && (
              <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {errorMsg}
              </div>
            )}

            <button
              type="submit"
              disabled={status === "sending"}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-accent-primary text-bg-primary font-semibold text-sm hover:bg-accent-primary/90 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {status === "sending" ? (
                <>
                  <Send className="w-4 h-4 animate-pulse" />
                  Sending…
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Send message
                </>
              )}
            </button>
          </form>
        )}

        {/* Alt contact */}
        <div className="mt-12 pt-8 border-t border-border flex items-center gap-3 text-text-muted">
          <Mail className="w-4 h-4 shrink-0" />
          <p className="text-sm">
            Or email directly at{" "}
            <a href="mailto:madan@thinkinproducts.com" className="text-accent-primary hover:underline">
              madan@thinkinproducts.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}