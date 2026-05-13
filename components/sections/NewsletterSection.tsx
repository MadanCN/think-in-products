"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type Status = "idle" | "loading" | "success" | "error";

interface NewsletterSectionProps {
  variant?: "full" | "compact";
  source?: string;
}

export default function NewsletterSection({
  variant = "full",
  source = "homepage",
}: NewsletterSectionProps) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || status === "loading") return;

    setStatus("loading");
    setErrorMsg("");

    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          name: name.trim() || undefined,
          source,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error ?? "Something went wrong.");
        setStatus("error");
        return;
      }

      setStatus("success");
    } catch {
      setErrorMsg("Network error — please try again.");
      setStatus("error");
    }
  }

  if (variant === "compact") {
    return <CompactForm
      email={email}
      name={name}
      status={status}
      errorMsg={errorMsg}
      onEmailChange={setEmail}
      onNameChange={setName}
      onSubmit={handleSubmit}
    />;
  }

  return (
    <section
      id="newsletter"
      className="relative py-24 px-6 overflow-hidden"
    >
      {/* Glow orb */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="w-[600px] h-[300px] bg-accent-primary/6 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          {/* Badge */}
          <div className="flex justify-center mb-6">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-accent-primary/30 bg-accent-primary/10 text-accent-primary font-mono text-xs font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-accent-primary animate-pulse" />
              Learning in public, one note at a time.
            </span>
          </div>

          {/* Headline */}
          <h2 className="font-display text-3xl md:text-4xl font-extrabold text-text-primary text-center leading-tight mb-4">
            Notes from the product field.
          </h2>

          {/* Subtext */}
          <p className="text-text-secondary text-base md:text-lg leading-relaxed text-center mb-10 max-w-lg mx-auto">
            I document what I&rsquo;m learning as a Product Executive — real experiments,
            startup lessons, and what actually works. No spam. Unsubscribe any time.
          </p>

          {/* Form / success state */}
          <AnimatePresence mode="wait">
            {status === "success" ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.92 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                className="flex flex-col items-center gap-3 py-6 px-8 rounded-2xl bg-emerald-500/10 border border-emerald-500/25"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.1, type: "spring", stiffness: 300, damping: 20 }}
                >
                  <CheckCircle2 className="w-10 h-10 text-emerald-400" />
                </motion.div>
                <p className="font-display text-lg font-bold text-text-primary">
                  Check your inbox!
                </p>
                <p className="text-emerald-400/80 text-sm text-center">
                  You&rsquo;re in. A welcome note is on its way.
                </p>
              </motion.div>
            ) : (
              <motion.form
                key="form"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                onSubmit={handleSubmit}
                className="flex flex-col gap-3"
              >
                {/* Name (optional) */}
                <input
                  type="text"
                  placeholder="Your name (optional)"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={cn(
                    "w-full px-4 py-3 rounded-xl bg-bg-secondary border text-text-primary placeholder:text-text-muted",
                    "text-sm outline-none focus:border-accent-primary/50 transition-colors",
                    "border-border"
                  )}
                  aria-label="Your name (optional)"
                />

                {/* Email + button row */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    aria-label="Email address"
                    className={cn(
                      "flex-1 px-4 py-3 rounded-xl bg-bg-secondary border text-text-primary placeholder:text-text-muted",
                      "text-sm outline-none focus:border-accent-primary/50 transition-colors",
                      status === "error" ? "border-rose-500/50" : "border-border"
                    )}
                  />
                  <button
                    type="submit"
                    disabled={status === "loading"}
                    className="shrink-0 inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-accent-primary text-bg-primary text-sm font-semibold hover:bg-accent-primary/90 active:scale-[0.98] transition-all disabled:opacity-60"
                  >
                    {status === "loading" ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Subscribing…
                      </>
                    ) : (
                      <>
                        Subscribe
                        <Send className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>

                {/* Error */}
                {status === "error" && errorMsg && (
                  <motion.p
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-1.5 text-rose-400 text-sm"
                  >
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    {errorMsg}
                  </motion.p>
                )}
              </motion.form>
            )}
          </AnimatePresence>

          {/* Privacy note */}
          {status !== "success" && (
            <p className="font-mono text-xs text-text-muted text-center mt-4">
              No spam. Unsubscribe any time.
            </p>
          )}
        </motion.div>
      </div>
    </section>
  );
}

// ── Compact variant ──────────────────────────────────────────────────────────

interface CompactFormProps {
  email: string;
  name: string;
  status: Status;
  errorMsg: string;
  onEmailChange: (v: string) => void;
  onNameChange: (v: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}

function CompactForm({
  email,
  name,
  status,
  errorMsg,
  onEmailChange,
  onNameChange,
  onSubmit,
}: CompactFormProps) {
  return (
    <div className="w-full">
      <p className="font-display text-sm font-bold text-text-primary mb-1">
        Notes from the product field.
      </p>
      <p className="font-mono text-xs text-text-muted mb-3">
        Startup lessons, documented. Unsubscribe any time.
      </p>

      <AnimatePresence mode="wait">
        {status === "success" ? (
          <motion.div
            key="success"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 text-emerald-400 text-sm"
          >
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            You&rsquo;re in. Check your inbox.
          </motion.div>
        ) : (
          <motion.form
            key="form"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onSubmit={onSubmit}
            className="flex flex-col gap-2"
          >
            <input
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => onEmailChange(e.target.value)}
              required
              aria-label="Email address"
              className={cn(
                "w-full px-3 py-2 rounded-lg bg-bg-secondary border text-text-primary placeholder:text-text-muted",
                "text-xs outline-none focus:border-accent-primary/50 transition-colors",
                status === "error" ? "border-rose-500/50" : "border-border"
              )}
            />
            <input
              type="text"
              placeholder="Your name (optional)"
              value={name}
              onChange={(e) => onNameChange(e.target.value)}
              aria-label="Your name (optional)"
              className={cn(
                "w-full px-3 py-2 rounded-lg bg-bg-secondary border border-border text-text-primary placeholder:text-text-muted",
                "text-xs outline-none focus:border-accent-primary/50 transition-colors"
              )}
            />
            <button
              type="submit"
              disabled={status === "loading"}
              className="w-full py-2 rounded-lg bg-accent-primary text-bg-primary text-xs font-semibold hover:bg-accent-primary/90 transition-colors disabled:opacity-60"
            >
              {status === "loading" ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin mx-auto" />
              ) : (
                "Subscribe"
              )}
            </button>
          </motion.form>
        )}
      </AnimatePresence>

      {status === "error" && errorMsg && (
        <p className="flex items-center gap-1 text-rose-400 text-xs mt-2">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          {errorMsg}
        </p>
      )}
    </div>
  );
}
