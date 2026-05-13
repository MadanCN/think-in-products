"use client";

import { useState, useEffect } from "react";
import { SlideOver } from "@/components/admin/SlideOver";
import type { AdminPhase, PhaseInput } from "@/app/actions/roadmap";
import { cn } from "@/lib/utils";

const PRESET_COLORS = [
  "#00E5CC",
  "#6366F1",
  "#F59E0B",
  "#EC4899",
  "#10B981",
  "#8B5CF6",
];

interface PhaseFormProps {
  open: boolean;
  phase?: AdminPhase | null;
  onClose: () => void;
  onSave: (input: Omit<PhaseInput, "order_index">, id?: string) => Promise<void>;
}

export function PhaseForm({ open, phase, onClose, onSave }: PhaseFormProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState("#00E5CC");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Populate when editing
  useEffect(() => {
    if (phase) {
      setTitle(phase.title);
      setDescription(phase.description ?? "");
      setColor(phase.color);
    } else {
      setTitle("");
      setDescription("");
      setColor("#00E5CC");
    }
    setError("");
  }, [phase, open]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    setError("");
    try {
      await onSave({ title: title.trim(), description: description.trim() || null, color }, phase?.id);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  const isEdit = !!phase;

  return (
    <SlideOver
      open={open}
      onClose={onClose}
      title={isEdit ? "Edit Phase" : "New Phase"}
      width={440}
      footer={
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-border text-text-secondary text-sm hover:bg-white/5 transition-colors"
          >
            Cancel
          </button>
          <button
            form="phase-form"
            type="submit"
            disabled={saving || !title.trim()}
            className="px-5 py-2 rounded-lg bg-accent-primary text-bg-primary text-sm font-semibold hover:bg-accent-primary/90 transition-colors disabled:opacity-60"
          >
            {saving ? "Saving…" : isEdit ? "Save changes" : "Create phase"}
          </button>
        </div>
      }
    >
      <form id="phase-form" onSubmit={handleSubmit} className="space-y-5">
        {/* Title */}
        <Field label="Title" required>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Foundation"
            autoFocus
            required
            className="w-full px-4 py-2.5 rounded-xl bg-bg-secondary border border-border text-text-primary placeholder:text-text-muted text-sm outline-none focus:border-accent-primary/50 transition-colors"
          />
        </Field>

        {/* Description */}
        <Field label="Description">
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What this phase covers…"
            rows={3}
            className="w-full px-4 py-2.5 rounded-xl bg-bg-secondary border border-border text-text-primary placeholder:text-text-muted text-sm outline-none focus:border-accent-primary/50 transition-colors resize-none"
          />
        </Field>

        {/* Color */}
        <Field label="Accent colour">
          <div className="flex items-center gap-3">
            <div className="flex gap-2 flex-wrap">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  style={{ backgroundColor: c }}
                  className={cn(
                    "w-7 h-7 rounded-full transition-all",
                    color === c
                      ? "ring-2 ring-white ring-offset-2 ring-offset-bg-card scale-110"
                      : "hover:scale-110"
                  )}
                />
              ))}
            </div>
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              title="Custom colour"
              className="w-7 h-7 rounded-full overflow-hidden cursor-pointer bg-transparent border-0 p-0"
            />
            <span className="font-mono text-xs text-text-muted">{color}</span>
          </div>
        </Field>

        {/* Preview */}
        <div
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-bg-secondary border border-border"
          style={{ borderLeftColor: color, borderLeftWidth: 3 }}
        >
          <div
            className="w-2.5 h-2.5 rounded-full shrink-0"
            style={{ backgroundColor: color }}
          />
          <span className="text-sm text-text-primary font-medium">
            {title || "Phase title"}
          </span>
        </div>

        {error && (
          <p className="text-rose-400 text-xs font-mono">{error}</p>
        )}
      </form>
    </SlideOver>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="font-mono text-xs text-text-muted uppercase tracking-wider">
        {label}
        {required && <span className="text-accent-primary ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}
