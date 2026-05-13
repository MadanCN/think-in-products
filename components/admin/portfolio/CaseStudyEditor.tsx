"use client";

import { useState, useRef } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { ArrowLeft, ChevronDown, Plus, Trash2, CheckCheck, Loader2 } from "lucide-react";
import Link from "next/link";
import { TagInput } from "@/components/admin/TagInput";
import { useToast, ToastContainer } from "@/components/admin/Toast";
import { createCase, updateCase } from "@/app/actions/portfolio";
import type { AdminCase, CaseInput } from "@/app/actions/portfolio";
import { MetricCard } from "@/components/portfolio/MetricCard";
import { cn } from "@/lib/utils";
import "@uiw/react-md-editor/markdown-editor.css";

const MDEditor = dynamic(() => import("@uiw/react-md-editor"), { ssr: false });

type Status = "draft" | "published";

const CONTENT_SECTIONS = [
  { key: "problem" as const, label: "The Problem", hint: "Plain text — shown as a highlighted callout" },
  { key: "approach" as const, label: "My Approach", hint: "Markdown" },
  { key: "outcome" as const, label: "Outcomes", hint: "Markdown" },
  { key: "learnings" as const, label: "Learnings", hint: "Markdown" },
];

type ContentKey = "problem" | "approach" | "outcome" | "learnings";

function toSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

const INPUT_CLS =
  "w-full px-4 py-2.5 rounded-xl bg-bg-secondary border border-border text-text-primary placeholder:text-text-muted text-sm outline-none focus:border-accent-primary/50 transition-colors";

const EMPTY_FORM = {
  title: "",
  slug: "",
  company: "",
  role: "",
  timeline: "",
  problem: "",
  approach: "",
  outcome: "",
  learnings: "",
  tags: [] as string[],
  figma_url: "",
  cover_image_url: "",
  metrics: [] as Array<{ label: string; value: string }>,
  is_featured: false,
  status: "draft" as Status,
  order_index: 0,
};

interface CaseStudyEditorProps {
  caseStudy: AdminCase | null;
}

export function CaseStudyEditor({ caseStudy }: CaseStudyEditorProps) {
  const router = useRouter();

  const [form, setForm] = useState(
    caseStudy
      ? {
          title: caseStudy.title,
          slug: caseStudy.slug,
          company: caseStudy.company ?? "",
          role: caseStudy.role ?? "",
          timeline: caseStudy.timeline ?? "",
          problem: caseStudy.problem ?? "",
          approach: caseStudy.approach ?? "",
          outcome: caseStudy.outcome ?? "",
          learnings: caseStudy.learnings ?? "",
          tags: caseStudy.tags,
          figma_url: caseStudy.figma_url ?? "",
          cover_image_url: caseStudy.cover_image_url ?? "",
          metrics: caseStudy.metrics,
          is_featured: caseStudy.is_featured,
          status: caseStudy.status as Status,
          order_index: caseStudy.order_index,
        }
      : EMPTY_FORM
  );

  const [caseId, setCaseId] = useState<string | null>(caseStudy?.id ?? null);
  const [slugCustomized, setSlugCustomized] = useState(
    caseStudy ? caseStudy.slug !== toSlug(caseStudy.title) : false
  );
  const [openSections, setOpenSections] = useState<Record<ContentKey, boolean>>({
    problem: true,
    approach: true,
    outcome: false,
    learnings: false,
  });
  const [saving, setSaving] = useState(false);
  const [saveState, setSaveState] = useState<"saved" | "modified">(
    caseStudy ? "saved" : "modified"
  );
  const { toasts, toast, dismiss } = useToast();

  const formRef = useRef(form);
  formRef.current = form;

  const caseIdRef = useRef(caseId);
  caseIdRef.current = caseId;

  function update<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setSaveState("modified");
  }

  function handleTitleChange(val: string) {
    setForm((prev) => ({
      ...prev,
      title: val,
      slug: slugCustomized ? prev.slug : toSlug(val),
    }));
    setSaveState("modified");
  }

  function handleSlugChange(val: string) {
    setSlugCustomized(true);
    update("slug", val);
  }

  function addMetric() {
    update("metrics", [...form.metrics, { label: "", value: "" }]);
  }

  function updateMetric(i: number, key: "label" | "value", val: string) {
    setForm((prev) => ({
      ...prev,
      metrics: prev.metrics.map((m, idx) => (idx === i ? { ...m, [key]: val } : m)),
    }));
    setSaveState("modified");
  }

  function removeMetric(i: number) {
    setForm((prev) => ({
      ...prev,
      metrics: prev.metrics.filter((_, idx) => idx !== i),
    }));
    setSaveState("modified");
  }

  function buildPayload(f: typeof form, overrides?: Partial<CaseInput>): Partial<CaseInput> {
    return {
      title: f.title,
      slug: f.slug || `untitled-${Date.now()}`,
      company: f.company || null,
      role: f.role || null,
      timeline: f.timeline || null,
      problem: f.problem || null,
      approach: f.approach || null,
      outcome: f.outcome || null,
      learnings: f.learnings || null,
      tags: f.tags,
      figma_url: f.figma_url || null,
      cover_image_url: f.cover_image_url || null,
      metrics: f.metrics.filter((m) => m.label && m.value),
      is_featured: f.is_featured,
      status: f.status,
      order_index: f.order_index,
      ...overrides,
    };
  }

  async function persist(f: typeof form, overrides?: Partial<CaseInput>) {
    const payload = buildPayload(f, overrides);
    const currentId = caseIdRef.current;

    if (currentId) {
      return updateCase(currentId, payload);
    } else {
      const created = await createCase(payload);
      setCaseId(created.id);
      caseIdRef.current = created.id;
      router.replace(`/admin/portfolio/${created.id}`);
      return created;
    }
  }

  async function handleSave(asStatus?: Status) {
    setSaving(true);
    try {
      await persist(formRef.current, asStatus ? { status: asStatus } : undefined);
      if (asStatus) setForm((prev) => ({ ...prev, status: asStatus }));
      setSaveState("saved");
      toast({ message: asStatus === "published" ? "Case study published!" : "Saved" });
    } catch {
      toast({ message: "Failed to save", type: "error" });
    } finally {
      setSaving(false);
    }
  }

  const validMetrics = form.metrics.filter((m) => m.label && m.value);
  const isNew = !caseId;

  return (
    <>
      <div className="pb-24">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 mb-8">
          <Link
            href="/admin/portfolio"
            className="flex items-center gap-1.5 font-mono text-xs text-text-muted hover:text-text-primary transition-colors group"
          >
            <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5" />
            Portfolio
          </Link>
          <span className="text-border text-xs">/</span>
          <span className="font-mono text-xs text-text-muted truncate max-w-xs">
            {form.title || (isNew ? "New Case Study" : "Untitled")}
          </span>
        </div>

        <div className="max-w-4xl mx-auto space-y-8">
          {/* ── Section 1: Basics ── */}
          <FormSection title="Basics">
            <div className="grid grid-cols-2 gap-5">
              <Field label="Title" className="col-span-2">
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  placeholder="Case study title…"
                  autoFocus={isNew}
                  className={cn(INPUT_CLS, "font-display font-semibold text-base")}
                />
              </Field>

              <Field label="Company">
                <input
                  type="text"
                  value={form.company}
                  onChange={(e) => update("company", e.target.value)}
                  placeholder="e.g. Acme Corp"
                  className={INPUT_CLS}
                />
              </Field>

              <Field label="Role">
                <input
                  type="text"
                  value={form.role}
                  onChange={(e) => update("role", e.target.value)}
                  placeholder="e.g. Product Manager"
                  className={INPUT_CLS}
                />
              </Field>

              <Field label="Timeline">
                <input
                  type="text"
                  value={form.timeline}
                  onChange={(e) => update("timeline", e.target.value)}
                  placeholder="e.g. Q3 2024 · 6 weeks"
                  className={INPUT_CLS}
                />
              </Field>

              <Field label="Order index">
                <input
                  type="number"
                  min={0}
                  value={form.order_index}
                  onChange={(e) => update("order_index", Number(e.target.value))}
                  className={cn(INPUT_CLS, "w-28")}
                />
              </Field>

              <Field label="Slug" className="col-span-2">
                <input
                  type="text"
                  value={form.slug}
                  onChange={(e) => handleSlugChange(e.target.value)}
                  placeholder="auto-generated-from-title"
                  className={cn(INPUT_CLS, "font-mono")}
                />
              </Field>

              <Field label="Cover image URL" className="col-span-2">
                <input
                  type="url"
                  value={form.cover_image_url}
                  onChange={(e) => update("cover_image_url", e.target.value)}
                  placeholder="https://…"
                  className={INPUT_CLS}
                />
                {form.cover_image_url && (
                  <div className="mt-2 h-32 rounded-xl overflow-hidden border border-border">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={form.cover_image_url}
                      alt="Cover preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
              </Field>

              <Field label="Figma URL" className="col-span-2">
                <input
                  type="url"
                  value={form.figma_url}
                  onChange={(e) => update("figma_url", e.target.value)}
                  placeholder="https://figma.com/…"
                  className={INPUT_CLS}
                />
              </Field>

              <Field label="Tags" className="col-span-2">
                <TagInput
                  value={form.tags}
                  onChange={(tags) => update("tags", tags)}
                />
              </Field>

              <div className="col-span-2 flex items-center gap-8 flex-wrap">
                <Toggle
                  label="Featured"
                  checked={form.is_featured}
                  onChange={(v) => update("is_featured", v)}
                />
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs text-text-muted uppercase tracking-wider">
                    Status
                  </span>
                  <div className="flex gap-1 p-1 bg-bg-secondary rounded-xl border border-border">
                    {(["draft", "published"] as Status[]).map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => update("status", s)}
                        className={cn(
                          "px-3 py-1.5 rounded-lg text-xs font-mono capitalize transition-all",
                          form.status === s
                            ? s === "published"
                              ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                              : "bg-bg-card text-text-primary border border-border"
                            : "text-text-muted hover:text-text-secondary"
                        )}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </FormSection>

          {/* ── Section 2: Content ── */}
          <FormSection title="Content">
            <div className="space-y-3">
              {CONTENT_SECTIONS.map(({ key, label, hint }) => (
                <div key={key} className="border border-border rounded-xl overflow-hidden">
                  <button
                    type="button"
                    onClick={() =>
                      setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }))
                    }
                    className="w-full flex items-center justify-between px-4 py-3 bg-bg-secondary/60 hover:bg-white/5 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="font-display font-semibold text-sm text-text-primary">
                        {label}
                      </span>
                      <span className="font-mono text-2xs text-text-muted hidden sm:inline">
                        {hint}
                      </span>
                      {form[key] && (
                        <span className="w-1.5 h-1.5 rounded-full bg-accent-primary shrink-0" />
                      )}
                    </div>
                    <ChevronDown
                      className={cn(
                        "w-4 h-4 text-text-muted transition-transform shrink-0",
                        openSections[key] && "rotate-180"
                      )}
                    />
                  </button>

                  {openSections[key] && (
                    <div data-color-mode="dark" className="border-t border-border">
                      <MDEditor
                        value={form[key]}
                        onChange={(val) => {
                          setForm((prev) => ({ ...prev, [key]: val ?? "" }));
                          setSaveState("modified");
                        }}
                        height={280}
                        preview="live"
                        style={{ borderRadius: 0, border: "none" }}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </FormSection>

          {/* ── Section 3: Metrics ── */}
          <FormSection title="Metrics">
            <div className="space-y-3">
              {form.metrics.map((m, i) => (
                <div key={i} className="flex gap-3 items-center">
                  <input
                    type="text"
                    value={m.label}
                    onChange={(e) => updateMetric(i, "label", e.target.value)}
                    placeholder="Label (e.g. DAU Increase)"
                    className={cn(INPUT_CLS, "flex-1")}
                  />
                  <input
                    type="text"
                    value={m.value}
                    onChange={(e) => updateMetric(i, "value", e.target.value)}
                    placeholder="Value (e.g. 34%)"
                    className={cn(INPUT_CLS, "w-36")}
                  />
                  <button
                    type="button"
                    onClick={() => removeMetric(i)}
                    className="p-1.5 rounded-lg hover:bg-rose-500/10 text-text-muted hover:text-rose-400 transition-colors shrink-0"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}

              <button
                type="button"
                onClick={addMetric}
                className="flex items-center gap-1.5 font-mono text-xs text-text-muted hover:text-accent-primary transition-colors mt-1"
              >
                <Plus className="w-3.5 h-3.5" />
                Add metric
              </button>
            </div>

            {validMetrics.length > 0 && (
              <div className="mt-6">
                <p className="font-mono text-2xs text-text-muted uppercase tracking-wider mb-3">
                  Preview
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {validMetrics.map((m) => (
                    <MetricCard key={m.label} label={m.label} value={m.value} />
                  ))}
                </div>
              </div>
            )}
          </FormSection>
        </div>
      </div>

      {/* Fixed save bar */}
      <div className="fixed bottom-0 left-60 right-0 z-40 bg-bg-primary/90 backdrop-blur-sm border-t border-border px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2 font-mono text-xs">
          {saving ? (
            <span className="flex items-center gap-1.5 text-text-muted">
              <Loader2 className="w-3 h-3 animate-spin" />
              Saving…
            </span>
          ) : saveState === "saved" ? (
            <span className="flex items-center gap-1.5 text-emerald-400">
              <CheckCheck className="w-3.5 h-3.5" />
              Saved
            </span>
          ) : (
            <span className="text-text-muted">
              {isNew ? "Not saved yet" : "Unsaved changes"}
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => handleSave()}
            disabled={saving}
            className="px-4 py-2 rounded-lg border border-border text-text-secondary text-sm font-semibold hover:bg-white/5 transition-colors disabled:opacity-50"
          >
            {isNew ? "Create Draft" : "Save Draft"}
          </button>
          <button
            type="button"
            onClick={() => handleSave("published")}
            disabled={saving}
            className="px-4 py-2 rounded-lg bg-accent-primary text-bg-primary text-sm font-semibold hover:bg-accent-primary/90 transition-colors disabled:opacity-60"
          >
            {form.status === "published" && !isNew ? "Update Published" : "Publish"}
          </button>
        </div>
      </div>

      <ToastContainer toasts={toasts} dismiss={dismiss} />
    </>
  );
}

function FormSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border bg-bg-secondary/20 overflow-hidden">
      <div className="px-6 py-4 border-b border-border">
        <h2 className="font-display font-bold text-sm text-text-primary">{title}</h2>
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

function Field({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <label className="font-mono text-xs text-text-muted uppercase tracking-wider">
        {label}
      </label>
      {children}
    </div>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-2.5 cursor-pointer select-none">
      <div
        onClick={() => onChange(!checked)}
        className={cn(
          "w-9 h-5 rounded-full transition-colors",
          checked ? "bg-accent-primary" : "bg-bg-secondary border border-border"
        )}
      >
        <div
          className={cn(
            "w-3.5 h-3.5 rounded-full bg-white shadow transition-transform mt-[3px]",
            checked ? "translate-x-[18px]" : "translate-x-[3px]"
          )}
        />
      </div>
      <span className="font-mono text-xs text-text-muted">{label}</span>
    </label>
  );
}
