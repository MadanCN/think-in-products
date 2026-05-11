"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Send, CheckCircle2, AlertCircle } from "lucide-react";
import { Button, Input, Badge } from "@/components/ui";

type Status = "idle" | "loading" | "success" | "error";

export default function NewsletterSection() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;

    setStatus("loading");
    setErrorMessage("");

    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.error ?? "Something went wrong.");
        setStatus("error");
        return;
      }

      setStatus("success");
      setEmail("");
    } catch {
      setErrorMessage("Network error. Please try again.");
      setStatus("error");
    }
  }

  return (
    <section id="newsletter" className="py-24 px-6">
      <div className="max-w-2xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="space-y-6"
        >
          <Badge variant="solid" className="inline-flex">
            Bi-weekly newsletter
          </Badge>

          <h2 className="font-display text-3xl md:text-4xl font-bold text-text-primary">
            One piece. No noise.
          </h2>
          <p className="text-text-secondary text-lg leading-relaxed">
            Every two weeks: one well-considered piece on product thinking. No roundups, no reposts. Just the thing and why it matters.
          </p>

          {status === "success" ? (
            <div className="flex items-center justify-center gap-3 py-4 px-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <p className="text-emerald-400 font-medium">You&rsquo;re in. Check your inbox for a welcome note.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
              <Input
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="flex-1"
                error={status === "error" ? errorMessage : undefined}
                aria-label="Email address"
              />
              <Button
                type="submit"
                variant="primary"
                size="md"
                disabled={status === "loading"}
                className="shrink-0"
              >
                {status === "loading" ? (
                  "Subscribing…"
                ) : (
                  <>
                    Subscribe
                    <Send className="w-4 h-4" />
                  </>
                )}
              </Button>
            </form>
          )}

          {status === "error" && !errorMessage && (
            <div className="flex items-center justify-center gap-2 text-rose-400 text-sm">
              <AlertCircle className="w-4 h-4" />
              Something went wrong. Please try again.
            </div>
          )}

          <p className="font-mono text-xs text-text-muted">
            No spam. Unsubscribe any time.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
