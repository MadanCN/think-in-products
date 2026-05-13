"use client";

import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, XCircle, X } from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

export type ToastType = "success" | "error" | "info";

export interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
}

// ─── useToast hook ────────────────────────────────────────────────────────────

export function useToast() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const toast = useCallback(
    ({
      message,
      type = "success",
      duration = 3500,
    }: {
      message: string;
      type?: ToastType;
      duration?: number;
    }) => {
      const id = crypto.randomUUID();
      setToasts((prev) => [...prev, { id, message, type }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, duration);
    },
    []
  );

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return { toasts, toast, dismiss };
}

// ─── Individual toast ─────────────────────────────────────────────────────────

function ToastItem({
  item,
  onDismiss,
}: {
  item: ToastItem;
  onDismiss: () => void;
}) {
  const Icon = item.type === "success" ? CheckCircle2 : XCircle;
  const colors = {
    success:
      "bg-emerald-950/80 border-emerald-500/30 text-emerald-300 [--icon:theme(colors.emerald.400)]",
    error:
      "bg-rose-950/80 border-rose-500/30 text-rose-300 [--icon:theme(colors.rose.400)]",
    info: "bg-bg-card border-border text-text-primary",
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 8, scale: 0.96 }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
      className={cn(
        "flex items-center gap-3 px-4 py-3 rounded-xl border shadow-lg backdrop-blur-sm max-w-sm min-w-[280px]",
        colors[item.type]
      )}
    >
      <Icon className="w-4 h-4 shrink-0 text-[var(--icon,currentColor)]" />
      <p className="flex-1 text-sm font-medium">{item.message}</p>
      <button
        onClick={onDismiss}
        className="shrink-0 p-0.5 rounded opacity-60 hover:opacity-100 transition-opacity"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </motion.div>
  );
}

// ─── Toast container ──────────────────────────────────────────────────────────

export function ToastContainer({
  toasts,
  dismiss,
}: {
  toasts: ToastItem[];
  dismiss: (id: string) => void;
}) {
  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2 items-end pointer-events-none">
      <AnimatePresence mode="popLayout">
        {toasts.map((t) => (
          <div key={t.id} className="pointer-events-auto">
            <ToastItem item={t} onDismiss={() => dismiss(t.id)} />
          </div>
        ))}
      </AnimatePresence>
    </div>
  );
}
