"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { Plus, Trash2 } from "lucide-react";
import { SlideOver } from "@/components/admin/SlideOver";
import { TagInput } from "@/components/admin/TagInput";
import type { AdminNode, NodeInput } from "@/app/actions/roadmap";
import { cn } from "@/lib/utils";
import "@uiw/react-md-editor/markdown-editor.css";

// Dynamic import — editor uses browser APIs
const MDEditor = dynamic(() => import("@uiw/react-md-editor"), { ssr: false });

// ─── Types ────────────────────────────────────────────────────────────────────

type Difficulty = "beginner" | "intermediate" | "advanced";
type ResourceType = "article" | "book" | "video" | "tool";

interface Resource {
  label: string;
  url: string;
  type: ResourceType;
}

const DIFFICULTIES: Difficulty[] = ["beginner", "intermediate", "advanced"];
const RESOURCE_TYPES: ResourceType[] = ["article", "book", "video", "tool"];

const DIFFICULTY_STYLE: Record<Difficulty, string> = {
  beginner: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  intermediate: "bg-amber-500/20 text-amber-300 border-amber-500/30",
  advanced: "bg-rose-500/20 text-rose-300 border-rose-500/30",
};

// ─── Form ─────────────────────────────────────────────────────────────────────

interface NodeFormProps {
  open: boolean;
  node?: AdminNode | null;
  phaseId: string;
  onClose: () => void;
  onSave: (input: NodeInput, id?: string) => Promise<void>;
}

export function NodeForm({ open, node, phaseId, onClose, onSave }: NodeFormProps) {
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [description, setDescription] = useState("");
  const [difficulty, setDifficulty] = useState<Difficulty>("beginner");
  const [estimatedHours, setEstimatedHours] = useState(2);
  const [tags, setTags] = useState<string[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [isPublished, setIsPublished] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Populate when editing
  useEffect(() => {
    if (node) {
      setTitle(node.title);
      setSummary(node.summary ?? "");
      setDescription(node.description ?? "");
      setDifficulty(node.difficulty);
      setEstimatedHours(node.estimated_hours);
      setTags(node.tags ?? []);
      setResources((node.resources ?? []) as Resource[]);
      setIsPublished(node.is_published);
    } else {
      setTitle("");
      setSummary("");
      setDescription("");
      setDifficulty("beginner");
      setEstimatedHours(2);
      setTags([]);
      setResources([]);
      setIsPublished(true);
    }
    setError("");
  }, [node, open]);

  // ── Resource helpers ──
  function addResource() {
    setResources((prev) => [...prev, { label: "", url: "", type: "article" }]);
  }
  function updateResource<K extends keyof Resource>(
    i: number,
    key: K,
    val: Resource[K]
  ) {
    setResources((prev) => prev.map((r, idx) => (idx === i ? { ...r, [key]: val } : r)));
  }
  function removeResource(i: number) {
    setResources((prev) => prev.filter((_, idx) => idx !== i));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    setError("");
    try {
      await onSave(
        {
          phase_id: phaseId,
          title: title.trim(),
          summary: summary.trim() || null,
          description: description.trim() || null,
          difficulty,
          estimated_hours: estimatedHours,
          tags,
          resources: resources.filter((r) => r.label && r.url),
          is_published: isPublished,
        },
        node?.id
      );
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  const isEdit = !!node;

  return (
    <SlideOver
      open={open}
      onClose={onClose}
      title={isEdit ? "Edit Node" : "New Node"}
      width={580}
      footer={
        <div className="flex items-center justify-between gap-3">
          {/* Published toggle */}
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={isPublished}
              onChange={(e) => setIsPublished(e.target.checked)}
              className="sr-only"
            />
            <div
              className={cn(
                "w-9 h-5 rounded-full transition-colors",
                isPublished ? "bg-accent-primary" : "bg-bg-secondary border border-border"
              )}
              onClick={() => setIsPublished((v) => !v)}
            >
              <div
                className={cn(
                  "w-3.5 h-3.5 rounded-full bg-white shadow transition-transform mt-[3px]",
                  isPublished ? "translate-x-[18px]" : "translate-x-[3px]"
                )}
              />
            </div>
            <span className="font-mono text-xs text-text-muted">
              {isPublished ? "Published" : "Draft"}
            </span>
          </label>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-border text-text-secondary text-sm hover:bg-white/5 transition-colors"
            >
              Cancel
            </button>
            <button
              form="node-form"
              type="submit"
              disabled={saving || !title.trim()}
              className="px-5 py-2 rounded-lg bg-accent-primary text-bg-primary text-sm font-semibold hover:bg-accent-primary/90 transition-colors disabled:opacity-60"
            >
              {saving ? "Saving…" : isEdit ? "Save changes" : "Create node"}
            </button>
          </div>
        </div>
      }
    >
      <form id="node-form" onSubmit={handleSubmit} className="space-y-5">
        {/* Title */}
        <Field label="Title" required>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Discovery Fundamentals"
            autoFocus
            required
            className="w-full px-4 py-2.5 rounded-xl bg-bg-secondary border border-border text-text-primary placeholder:text-text-muted text-sm outline-none focus:border-accent-primary/50 transition-colors"
          />
        </Field>

        {/* Summary */}
        <Field label="Summary">
          <div className="relative">
            <textarea
              value={summary}
              onChange={(e) =>
                e.target.value.length <= 200 && setSummary(e.target.value)
              }
              placeholder="One-line card description…"
              rows={2}
              className="w-full px-4 py-2.5 rounded-xl bg-bg-secondary border border-border text-text-primary placeholder:text-text-muted text-sm outline-none focus:border-accent-primary/50 transition-colors resize-none pr-14"
            />
            <span
              className={cn(
                "absolute bottom-2.5 right-3 font-mono text-xs",
                summary.length > 180 ? "text-amber-400" : "text-text-muted"
              )}
            >
              {summary.length}/200
            </span>
          </div>
        </Field>

        {/* Difficulty */}
        <Field label="Difficulty">
          <div className="flex gap-1 p-1 bg-bg-secondary rounded-xl border border-border">
            {DIFFICULTIES.map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setDifficulty(d)}
                className={cn(
                  "flex-1 py-1.5 px-2 rounded-lg text-xs font-mono capitalize transition-all",
                  difficulty === d
                    ? cn("border", DIFFICULTY_STYLE[d])
                    : "text-text-muted hover:text-text-secondary"
                )}
              >
                {d}
              </button>
            ))}
          </div>
        </Field>

        {/* Estimated hours */}
        <Field label="Estimated hours">
          <input
            type="number"
            min={1}
            max={40}
            value={estimatedHours}
            onChange={(e) => setEstimatedHours(Number(e.target.value))}
            className="w-24 px-4 py-2.5 rounded-xl bg-bg-secondary border border-border text-text-primary text-sm outline-none focus:border-accent-primary/50 transition-colors"
          />
        </Field>

        {/* Tags */}
        <Field label="Tags">
          <TagInput value={tags} onChange={setTags} />
        </Field>

        {/* Description (MD editor) */}
        <Field label="Description (Markdown)">
          <div data-color-mode="dark">
            <MDEditor
              value={description}
              onChange={(val) => setDescription(val ?? "")}
              height={260}
              preview="edit"
            />
          </div>
        </Field>

        {/* Resources */}
        <Field label="Resources">
          <div className="space-y-2">
            {resources.map((r, i) => (
              <div key={i} className="flex gap-2 items-start">
                <div className="flex-1 grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={r.label}
                    onChange={(e) => updateResource(i, "label", e.target.value)}
                    placeholder="Label"
                    className="px-3 py-2 rounded-lg bg-bg-secondary border border-border text-text-primary placeholder:text-text-muted text-xs outline-none focus:border-accent-primary/50 transition-colors"
                  />
                  <input
                    type="url"
                    value={r.url}
                    onChange={(e) => updateResource(i, "url", e.target.value)}
                    placeholder="https://…"
                    className="px-3 py-2 rounded-lg bg-bg-secondary border border-border text-text-primary placeholder:text-text-muted text-xs outline-none focus:border-accent-primary/50 transition-colors"
                  />
                  <select
                    value={r.type}
                    onChange={(e) =>
                      updateResource(i, "type", e.target.value as ResourceType)
                    }
                    className="col-span-2 px-3 py-2 rounded-lg bg-bg-secondary border border-border text-text-secondary text-xs outline-none focus:border-accent-primary/50 transition-colors"
                  >
                    {RESOURCE_TYPES.map((t) => (
                      <option key={t} value={t} className="bg-bg-secondary">
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  type="button"
                  onClick={() => removeResource(i)}
                  className="mt-2 p-1.5 rounded-lg hover:bg-rose-500/10 text-text-muted hover:text-rose-400 transition-colors shrink-0"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={addResource}
              className="flex items-center gap-1.5 text-xs font-mono text-text-muted hover:text-accent-primary transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Add resource
            </button>
          </div>
        </Field>

        {error && <p className="text-rose-400 text-xs font-mono">{error}</p>}
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
