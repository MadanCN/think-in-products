"use client";

import { useEffect, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  X, Clock, ExternalLink, BookOpen, FileText, Play, Wrench,
  ChevronLeft, ChevronRight,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import type { RoadmapNodeDB, NodeResource } from "@/types";

const RESOURCE_ICONS: Record<NodeResource["type"], React.ElementType> = {
  book: BookOpen, article: FileText, video: Play, tool: Wrench,
};

const RESOURCE_COLORS: Record<NodeResource["type"], string> = {
  book:    "text-amber-400  bg-amber-400/10  border-amber-400/20",
  article: "text-sky-400    bg-sky-400/10    border-sky-400/20",
  video:   "text-rose-400   bg-rose-400/10   border-rose-400/20",
  tool:    "text-violet-400 bg-violet-400/10 border-violet-400/20",
};

const DIFFICULTY_STYLES = {
  beginner:     "bg-emerald-500/10 text-emerald-400 border-emerald-500/25",
  intermediate: "bg-amber-500/10   text-amber-400   border-amber-500/25",
  advanced:     "bg-rose-500/10    text-rose-400    border-rose-500/25",
} as const;

const MD_COMPONENTS: React.ComponentProps<typeof ReactMarkdown>["components"] = {
  h2: ({ children }) => (
    <h2 className="font-display text-lg font-bold text-text-primary mt-7 mb-2 first:mt-0">{children}</h2>
  ),
  h3: ({ children }) => (
    <h3 className="font-display text-base font-semibold text-text-primary mt-5 mb-2">{children}</h3>
  ),
  p: ({ children }) => <p className="text-text-secondary text-sm leading-[1.8] mb-4">{children}</p>,
  ul: ({ children }) => <ul className="space-y-1.5 mb-4 pl-1">{children}</ul>,
  li: ({ children }) => (
    <li className="flex items-start gap-2 text-text-secondary text-sm">
      <span className="mt-2 w-1 h-1 rounded-full bg-accent-primary shrink-0" />
      <span className="leading-[1.7]">{children}</span>
    </li>
  ),
  strong: ({ children }) => <strong className="font-semibold text-text-primary">{children}</strong>,
  code: ({ children }) => (
    <code className="font-mono text-xs bg-bg-secondary border border-border px-1.5 py-0.5 rounded text-accent-primary">
      {children}
    </code>
  ),
};

interface NodeDrawerProps {
  node: RoadmapNodeDB;
  phaseColor: string;
  hasPrev: boolean;
  hasNext: boolean;
  onPrev: () => void;
  onNext: () => void;
  onClose: () => void;
}

export default function NodeDrawer({
  node, phaseColor, hasPrev, hasNext, onPrev, onNext, onClose,
}: NodeDrawerProps) {
  const [mounted, setMounted] = useState(false);
  const [description, setDescription] = useState<string | null>(null);
  const [descLoading, setDescLoading] = useState(true);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    setDescription(null);
    setDescLoading(true);
    supabase
      .from("roadmap_nodes")
      .select("description")
      .eq("id", node.id)
      .single()
      .then(({ data }) => {
        setDescription(data?.description ?? null);
        setDescLoading(false);
      });
  }, [node.id]);

  const handleKey = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") { onClose(); return; }
      if (e.key === "ArrowLeft" && hasPrev) { onPrev(); return; }
      if (e.key === "ArrowRight" && hasNext) { onNext(); }
    },
    [onClose, hasPrev, hasNext, onPrev, onNext]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [handleKey]);

  if (!mounted) return null;

  return createPortal(
    <>
      {/* Backdrop */}
      <motion.div
        key="backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer panel */}
      <motion.aside
        key="drawer"
        role="dialog"
        aria-modal="true"
        aria-label={node.title}
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", stiffness: 320, damping: 36 }}
        className="fixed top-0 right-0 h-full w-full max-w-[500px] z-50 flex flex-col bg-bg-secondary border-l border-border shadow-2xl"
      >
        {/* Phase color bar */}
        <div className="h-1 w-full shrink-0" style={{ backgroundColor: phaseColor }} />

        {/* Header */}
        <div className="flex items-start justify-between gap-4 px-5 pt-4 pb-3 border-b border-border shrink-0">
          <div className="flex-1 min-w-0 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className={cn("inline-flex items-center px-2.5 py-0.5 rounded-full text-2xs font-mono font-semibold border", DIFFICULTY_STYLES[node.difficulty])}>
                {node.difficulty}
              </span>
              <span className="flex items-center gap-1 font-mono text-xs text-text-muted">
                <Clock className="w-3 h-3" strokeWidth={1.5} />
                ~{node.estimated_hours}h
              </span>
              {/* Open in page link */}
              <a
                href={`/roadmap/${node.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 font-mono text-xs text-text-muted hover:text-accent-primary transition-colors"
                title="Open in full page"
              >
                <ExternalLink className="w-3 h-3" />
                <span>Full page</span>
              </a>
            </div>
            <h2 className="font-display text-xl font-bold text-text-primary leading-snug">{node.title}</h2>
            <div className="flex flex-wrap gap-1.5">
              {node.tags.map((tag) => (
                <span key={tag} className="font-mono text-2xs px-2 py-0.5 rounded bg-bg-primary border border-border text-text-muted">
                  {tag}
                </span>
              ))}
            </div>
          </div>
          <button
            onClick={onClose}
            className="shrink-0 p-2 rounded-xl text-text-muted hover:text-text-primary hover:bg-white/5 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-7">
          {descLoading ? (
            <div className="space-y-2.5 animate-pulse">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-3.5 rounded-full bg-white/5" style={{ width: `${70 + Math.sin(i) * 20}%` }} />
              ))}
            </div>
          ) : description ? (
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={MD_COMPONENTS}>
              {description}
            </ReactMarkdown>
          ) : (
            <p className="text-text-muted text-sm italic">Full content coming soon.</p>
          )}

          {node.resources.length > 0 && (
            <div>
              <h3 className="font-mono text-xs text-text-muted uppercase tracking-widest mb-3">
                Resources
              </h3>
              <ul className="space-y-2">
                {node.resources.map((res, i) => {
                  const Icon = RESOURCE_ICONS[res.type] ?? FileText;
                  const colorClass = RESOURCE_COLORS[res.type] ?? RESOURCE_COLORS.article;
                  return (
                    <li key={i}>
                      <a
                        href={res.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group flex items-center gap-3 p-3 rounded-xl bg-bg-primary/60 border border-border hover:border-accent-primary/30 hover:bg-bg-primary transition-all duration-150"
                      >
                        <span className={cn("shrink-0 w-7 h-7 rounded-lg flex items-center justify-center border", colorClass)}>
                          <Icon className="w-3.5 h-3.5" strokeWidth={1.8} />
                        </span>
                        <span className="flex-1 min-w-0 text-sm text-text-secondary group-hover:text-text-primary transition-colors truncate">
                          {res.label}
                        </span>
                        <ExternalLink className="shrink-0 w-3.5 h-3.5 text-text-muted group-hover:text-accent-primary transition-colors" />
                      </a>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>

        {/* Footer: prev / next + keyboard hint */}
        <div className="shrink-0 px-5 py-3 border-t border-border bg-bg-primary/40 flex items-center justify-between gap-3">
          <button
            onClick={onPrev}
            disabled={!hasPrev}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono border border-border text-text-muted hover:text-text-primary hover:bg-white/5 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            Prev
          </button>

          <p className="font-mono text-xs text-text-muted text-center hidden sm:block">
            <kbd className="px-1.5 py-0.5 rounded bg-white/5 border border-border font-mono text-2xs">Esc</kbd>
            {" "}close
            {" · "}
            <kbd className="px-1.5 py-0.5 rounded bg-white/5 border border-border font-mono text-2xs">←</kbd>
            <kbd className="px-1.5 py-0.5 rounded bg-white/5 border border-border font-mono text-2xs">→</kbd>
            {" "}navigate
          </p>

          <button
            onClick={onNext}
            disabled={!hasNext}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono border border-border text-text-muted hover:text-text-primary hover:bg-white/5 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Next
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </motion.aside>
    </>,
    document.body
  );
}
