"use client";

import { useState } from "react";
import { Pencil, Trash2, Star, Plus } from "lucide-react";
import Link from "next/link";
import { ConfirmModal } from "@/components/admin/ConfirmModal";
import { useToast, ToastContainer } from "@/components/admin/Toast";
import { deleteCase, toggleCaseFeatured } from "@/app/actions/portfolio";
import type { AdminCase } from "@/app/actions/portfolio";
import { cn } from "@/lib/utils";

const STATUS_STYLE: Record<string, string> = {
  published: "bg-emerald-500/15 text-emerald-400 border-emerald-500/25",
  draft: "bg-bg-secondary text-text-muted border-border",
};

const GRADIENTS = [
  "from-accent-primary/20 to-indigo-500/10",
  "from-emerald-500/20 to-teal-500/10",
  "from-amber-500/20 to-orange-500/10",
  "from-rose-500/20 to-pink-500/10",
  "from-violet-500/20 to-purple-500/10",
];

interface PortfolioAdminListProps {
  initialCases: AdminCase[];
}

export function PortfolioAdminList({ initialCases }: PortfolioAdminListProps) {
  const [cases, setCases] = useState(initialCases);
  const [confirmDelete, setConfirmDelete] = useState<AdminCase | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const { toasts, toast, dismiss } = useToast();

  async function handleToggleFeatured(id: string, val: boolean) {
    setCases((prev) =>
      prev.map((c) => (c.id === id ? { ...c, is_featured: val } : c))
    );
    try {
      await toggleCaseFeatured(id, val);
    } catch {
      setCases((prev) =>
        prev.map((c) => (c.id === id ? { ...c, is_featured: !val } : c))
      );
      toast({ message: "Failed to update featured status", type: "error" });
    }
  }

  async function handleDelete() {
    if (!confirmDelete) return;
    setDeleteLoading(true);
    try {
      await deleteCase(confirmDelete.id);
      setCases((prev) => prev.filter((c) => c.id !== confirmDelete.id));
      toast({ message: "Case study deleted" });
    } catch {
      toast({ message: "Failed to delete case study", type: "error" });
    } finally {
      setDeleteLoading(false);
      setConfirmDelete(null);
    }
  }

  return (
    <>
      {cases.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <p className="text-text-muted font-mono text-sm">No case studies yet.</p>
          <Link
            href="/admin/portfolio/new"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-dashed border-border text-text-muted text-xs font-mono hover:border-accent-primary/40 hover:text-accent-primary transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Create first case study
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {cases.map((c, i) => (
            <div
              key={c.id}
              className="group flex flex-col rounded-2xl border border-border bg-bg-secondary overflow-hidden hover:border-border-glow transition-all duration-150"
            >
              {/* Cover image or gradient */}
              <div
                className={cn(
                  "relative h-36",
                  !c.cover_image_url &&
                    cn("bg-gradient-to-br", GRADIENTS[i % GRADIENTS.length])
                )}
              >
                {c.cover_image_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={c.cover_image_url}
                    alt={c.title}
                    className="w-full h-full object-cover"
                  />
                )}

                {/* Status badge */}
                <div className="absolute top-2.5 right-2.5">
                  <span
                    className={cn(
                      "px-2 py-0.5 rounded-md text-2xs font-mono border backdrop-blur-sm",
                      STATUS_STYLE[c.status]
                    )}
                  >
                    {c.status}
                  </span>
                </div>

                {/* Featured toggle */}
                <button
                  type="button"
                  onClick={() => handleToggleFeatured(c.id, !c.is_featured)}
                  className={cn(
                    "absolute top-2.5 left-2.5 p-1.5 rounded-lg backdrop-blur-sm transition-colors",
                    c.is_featured
                      ? "text-amber-400 bg-black/30"
                      : "text-white/60 bg-black/20 hover:text-amber-400"
                  )}
                  title={c.is_featured ? "Remove featured" : "Mark as featured"}
                >
                  <Star
                    className={cn(
                      "w-4 h-4",
                      c.is_featured && "fill-amber-400"
                    )}
                  />
                </button>
              </div>

              {/* Card body */}
              <div className="p-4 flex flex-col flex-1">
                <p className="font-display font-bold text-sm text-text-primary leading-snug line-clamp-2 flex-1">
                  {c.title}
                </p>
                {(c.company || c.role) && (
                  <p className="font-mono text-xs text-text-muted mt-1">
                    {[c.company, c.role].filter(Boolean).join(" · ")}
                  </p>
                )}
                {c.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {c.tags.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center px-1.5 py-0.5 rounded-md text-2xs font-mono bg-bg-primary border border-border/50 text-text-muted"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/50">
                  <Link href={`/admin/portfolio/${c.id}`}>
                    <button
                      type="button"
                      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-mono text-text-muted hover:text-text-primary hover:bg-white/5 transition-colors"
                    >
                      <Pencil className="w-3 h-3" />
                      Edit
                    </button>
                  </Link>
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(c)}
                    className="p-1.5 rounded-lg hover:bg-rose-500/10 text-text-muted hover:text-rose-400 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmModal
        open={!!confirmDelete}
        title="Delete case study?"
        message={`"${confirmDelete?.title}" and all its content will be permanently deleted.`}
        loading={deleteLoading}
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(null)}
      />

      <ToastContainer toasts={toasts} dismiss={dismiss} />
    </>
  );
}
