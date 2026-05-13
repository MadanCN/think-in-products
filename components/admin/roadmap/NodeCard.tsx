"use client";

import { GripVertical, Pencil, Trash2, ArrowRightLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AdminNode, AdminPhase } from "@/app/actions/roadmap";

interface NodeCardProps {
  node: AdminNode;
  phases?: AdminPhase[];
  dragHandleProps?: React.HTMLAttributes<HTMLDivElement>;
  isDragging?: boolean;
  onTogglePublished: (id: string, val: boolean) => void;
  onEdit: (node: AdminNode) => void;
  onDelete: (node: AdminNode) => void;
  onMove?: (node: AdminNode) => void;
}

const DIFFICULTY_BADGE: Record<string, string> = {
  beginner: "bg-emerald-500/15 text-emerald-400 border-emerald-500/25",
  intermediate: "bg-amber-500/15 text-amber-400 border-amber-500/25",
  advanced: "bg-rose-500/15 text-rose-400 border-rose-500/25",
};

export function NodeCard({
  node,
  phases = [],
  dragHandleProps,
  isDragging,
  onTogglePublished,
  onEdit,
  onDelete,
  onMove,
}: NodeCardProps) {
  return (
    <div
      className={cn(
        "group relative flex flex-col gap-3 p-4 rounded-xl",
        "bg-bg-secondary border border-border",
        "hover:border-border-glow transition-all duration-150",
        isDragging && "opacity-50 shadow-2xl scale-[1.02] border-accent-primary/30"
      )}
    >
      {/* Top row: drag + title */}
      <div className="flex items-start gap-2">
        <div
          {...dragHandleProps}
          className="mt-0.5 shrink-0 cursor-grab active:cursor-grabbing text-text-muted hover:text-text-secondary transition-colors"
        >
          <GripVertical className="w-4 h-4" />
        </div>
        <p className="text-sm font-semibold text-text-primary leading-snug flex-1 line-clamp-2">
          {node.title}
        </p>
      </div>

      {/* Meta row */}
      <div className="flex items-center gap-2 flex-wrap ml-6">
        <span
          className={cn(
            "inline-flex items-center px-2 py-0.5 rounded-md text-2xs font-mono border capitalize",
            DIFFICULTY_BADGE[node.difficulty]
          )}
        >
          {node.difficulty}
        </span>
        <span className="font-mono text-2xs text-text-muted">
          ~{node.estimated_hours}h
        </span>
      </div>

      {/* Actions row */}
      <div className="flex items-center justify-between ml-6">
        {/* Published toggle */}
        <button
          type="button"
          onClick={() => onTogglePublished(node.id, !node.is_published)}
          className={cn(
            "flex items-center gap-1.5 px-2.5 py-1 rounded-md text-2xs font-mono border transition-colors",
            node.is_published
              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/15"
              : "bg-text-muted/10 text-text-muted border-text-muted/20 hover:bg-white/5"
          )}
        >
          <span
            className={cn(
              "w-1.5 h-1.5 rounded-full",
              node.is_published ? "bg-emerald-400" : "bg-text-muted"
            )}
          />
          {node.is_published ? "published" : "draft"}
        </button>

        {/* Edit / move / delete */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {onMove && phases.length > 1 && (
            <button
              type="button"
              onClick={() => onMove(node)}
              title="Move to another phase"
              className="p-1.5 rounded-lg hover:bg-white/5 text-text-muted hover:text-accent-primary transition-colors"
            >
              <ArrowRightLeft className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            type="button"
            onClick={() => onEdit(node)}
            className="p-1.5 rounded-lg hover:bg-white/5 text-text-muted hover:text-text-primary transition-colors"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onDelete(node)}
            className="p-1.5 rounded-lg hover:bg-rose-500/10 text-text-muted hover:text-rose-400 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
