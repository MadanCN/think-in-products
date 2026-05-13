"use client";

import { motion } from "framer-motion";
import { AlertTriangle, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="text-center max-w-md"
      >
        <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mx-auto mb-6">
          <AlertTriangle className="w-7 h-7 text-rose-400" strokeWidth={1.5} />
        </div>

        <h1 className="font-display text-2xl font-bold text-text-primary mb-3">
          Something went wrong
        </h1>
        <p className="text-text-secondary text-sm leading-relaxed mb-2">
          {error.message || "An unexpected error occurred."}
        </p>
        {error.digest && (
          <p className="font-mono text-xs text-text-muted mb-8">
            Error ID: {error.digest}
          </p>
        )}

        <div className="flex gap-3 justify-center mt-6">
          <Button variant="primary" onClick={reset}>
            <RefreshCcw className="w-4 h-4" />
            Try Again
          </Button>
          <Button variant="ghost" href="/">
            Go Home
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
