"use client";

import { useState, useRef, useEffect } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { ArrowLeft, Clock, CheckCheck, Loader2 } from "lucide-react";
import Link from "next/link";
import { TagInput } from "@/components/admin/TagInput";
import { useToast, ToastContainer } from "@/components/admin/Toast";
import { createArticle, updateArticle } from "@/app/actions/articles";
import type { AdminArticle, ArticleInput } from "@/app/actions/articles";
import { cn } from "@/lib/utils";
import "@uiw/react-md-editor/markdown-editor.css";

const MDEditor = dynamic(() => import("@uiw/react-md-editor"), { ssr: false });

type Difficulty = "beginner" | "intermediate" | "advanced";
type Status = "draft" | "published" | "archived";

const DIFFICULTIES: Difficulty[] = ["beginner", "intermediate", "advanced"];
const STATUSES: Status[] = ["draft", "published", "archived"];

const DIFFICULTY_STYLE: Record<Difficulty, string> = {
  beginner: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  intermediate: "bg-amber-500/20 text-amber-300 border-amber-500/30",
  advanced: "bg-rose-500/20 text-rose-300 border-rose-500/30",
};

const STATUS_STYLE: Record<Status, string> = {
  draft: "bg-bg-card text-text-secondary border-border",
  published: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  archived: "bg-amber-500/20 text-amber-300 border-amber-500/30",
};

function toSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function calcReadTime(content: string): number {
  const words = content.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

function buildPayload(f: {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  cover_image: string;
  tags: string[];
  difficulty: Difficulty;
  status: Status;
  published_at: string;
  author: string;
}): Partial<ArticleInput> {
  return {
    title: f.title,
    slug: f.slug,
    excerpt: f.excerpt || null,
    content: f.content || null,
    cover_image: f.cover_image || null,
    tags: f.tags,
    difficulty: f.difficulty,
    status: f.status,
    published_at: f.published_at || null,
    author: f.author,
  };
}

const EMPTY_FORM = {
  title: "",
  slug: "",
  excerpt: "",
  content: "",
  cover_image: "",
  tags: [] as string[],
  difficulty: "beginner" as Difficulty,
  status: "draft" as Status,
  published_at: "",
  author: "Think in Products",
};

interface ArticleEditorProps {
  article: AdminArticle | null;
}

export function ArticleEditor({ article }: ArticleEditorProps) {
  const router = useRouter();

  const [form, setForm] = useState(
    article
      ? {
          title: article.title,
          slug: article.slug,
          excerpt: article.excerpt ?? "",
          content: article.content ?? "",
          cover_image: article.cover_image ?? "",
          tags: article.tags,
          difficulty: article.difficulty as Difficulty,
          status: article.status as Status,
          published_at: article.published_at ?? "",
          author: article.author,
        }
      : EMPTY_FORM
  );

  // null = not yet persisted to DB
  const [articleId, setArticleId] = useState<string | null>(article?.id ?? null);

  const [slugCustomized, setSlugCustomized] = useState(
    article ? article.slug !== toSlug(article.title) : false
  );
  const [saveState, setSaveState] = useState<"saved" | "saving" | "modified">(
    article ? "saved" : "modified"
  );
  const [publishing, setPublishing] = useState(false);
  const { toasts, toast, dismiss } = useToast();

  const formRef = useRef(form);
  formRef.current = form;

  const articleIdRef = useRef(articleId);
  articleIdRef.current = articleId;

  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  async function persist(f: typeof form, overrides?: Partial<ArticleInput>) {
    const payload = { ...buildPayload(f), ...overrides };
    const currentId = articleIdRef.current;

    if (currentId) {
      return updateArticle(currentId, payload);
    } else {
      const created = await createArticle(payload);
      setArticleId(created.id);
      articleIdRef.current = created.id;
      // Update URL so refreshing lands on the edit page
      router.replace(`/admin/articles/${created.id}`);
      return created;
    }
  }

  async function performSave(f: typeof form, overrides?: Partial<ArticleInput>) {
    setSaveState("saving");
    try {
      await persist(f, overrides);
      setSaveState("saved");
    } catch (err) {
      setSaveState("modified");
      toast({ message: err instanceof Error ? err.message : "Save failed", type: "error" });
    }
  }

  function scheduleAutoSave() {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      if (formRef.current.status !== "draft") return;
      await performSave(formRef.current);
    }, 30_000);
  }

  function update<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setSaveState("modified");
    scheduleAutoSave();
  }

  function handleTitleChange(val: string) {
    setForm((prev) => ({
      ...prev,
      title: val,
      slug: slugCustomized ? prev.slug : toSlug(val),
    }));
    setSaveState("modified");
    scheduleAutoSave();
  }

  function handleSlugChange(val: string) {
    setSlugCustomized(true);
    update("slug", val);
  }

  async function handleSaveDraft() {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    await performSave(formRef.current);
    setSaveState("saved");
  }

  async function handlePublish() {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setPublishing(true);
    const publishedAt = form.published_at || new Date().toISOString();
    const next = { ...form, status: "published" as Status, published_at: publishedAt };
    setForm(next);
    setSaveState("saving");
    try {
      await persist(next);
      setSaveState("saved");
      toast({ message: "Article published!", type: "success" });
      if (articleIdRef.current) router.replace(`/admin/articles/${articleIdRef.current}`);
    } catch (err) {
      setSaveState("modified");
      toast({ message: err instanceof Error ? err.message : "Publish failed", type: "error" });
    } finally {
      setPublishing(false);
    }
  }

  const readTime = calcReadTime(form.content);
  const isNew = !articleId;

  return (
    <>
      <div className="flex flex-col -m-8 h-[calc(100vh-3.5rem)] overflow-hidden">
        {/* Header bar */}
        <div className="h-14 shrink-0 border-b border-border px-5 flex items-center gap-4 bg-bg-primary/60 backdrop-blur-sm">
          <Link
            href="/admin/articles"
            className="shrink-0 flex items-center gap-1.5 font-mono text-xs text-text-muted hover:text-text-primary transition-colors group"
          >
            <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5" />
            Articles
          </Link>

          <div className="flex-1 min-w-0">
            <p className="font-display font-semibold text-sm text-text-primary truncate">
              {form.title || (isNew ? "New Article" : "Untitled")}
            </p>
          </div>

          {/* Save state indicator */}
          <div className="flex items-center gap-2 shrink-0">
            {saveState === "saving" && (
              <span className="flex items-center gap-1.5 font-mono text-xs text-text-muted">
                <Loader2 className="w-3 h-3 animate-spin" />
                Saving…
              </span>
            )}
            {saveState === "saved" && (
              <span className="flex items-center gap-1.5 font-mono text-xs text-emerald-400">
                <CheckCheck className="w-3.5 h-3.5" />
                Saved
              </span>
            )}
            {saveState === "modified" && (
              <span className="font-mono text-xs text-text-muted">
                {isNew ? "Not saved yet" : "Unsaved changes"}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleSaveDraft}
              disabled={saveState === "saving" || publishing}
              className="px-3.5 py-1.5 rounded-lg border border-border text-text-secondary text-xs font-semibold hover:bg-white/5 transition-colors disabled:opacity-50"
            >
              {isNew ? "Create Draft" : "Save Draft"}
            </button>
            <button
              onClick={handlePublish}
              disabled={publishing || saveState === "saving"}
              className="px-3.5 py-1.5 rounded-lg bg-accent-primary text-bg-primary text-xs font-semibold hover:bg-accent-primary/90 transition-colors disabled:opacity-60"
            >
              {publishing ? "Publishing…" : "Publish"}
            </button>
          </div>
        </div>

        {/* Split pane */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left — markdown editor */}
          <div
            className="flex-[3] overflow-hidden border-r border-border"
            data-color-mode="dark"
          >
            <MDEditor
              value={form.content}
              onChange={(val) => update("content", val ?? "")}
              preview="live"
              height="calc(100vh - 112px)"
              style={{ borderRadius: 0, border: "none" }}
            />
          </div>

          {/* Right — metadata */}
          <div className="flex-[2] overflow-y-auto p-6 space-y-5 bg-bg-secondary/20">
            <Field label="Title">
              <input
                type="text"
                value={form.title}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="Article title…"
                autoFocus={isNew}
                className="w-full px-4 py-3 rounded-xl bg-bg-secondary border border-border text-text-primary placeholder:text-text-muted font-display font-semibold text-base outline-none focus:border-accent-primary/50 transition-colors"
              />
            </Field>

            <Field label="Slug">
              <input
                type="text"
                value={form.slug}
                onChange={(e) => handleSlugChange(e.target.value)}
                placeholder="auto-generated-from-title"
                className="w-full px-4 py-2.5 rounded-xl bg-bg-secondary border border-border text-text-primary placeholder:text-text-muted font-mono text-sm outline-none focus:border-accent-primary/50 transition-colors"
              />
            </Field>

            <Field label="Excerpt">
              <div className="relative">
                <textarea
                  value={form.excerpt}
                  onChange={(e) =>
                    e.target.value.length <= 160 && update("excerpt", e.target.value)
                  }
                  placeholder="Short description shown in listings…"
                  rows={3}
                  className="w-full px-4 py-2.5 rounded-xl bg-bg-secondary border border-border text-text-primary placeholder:text-text-muted text-sm outline-none focus:border-accent-primary/50 transition-colors resize-none pr-14"
                />
                <span
                  className={cn(
                    "absolute bottom-2.5 right-3 font-mono text-xs",
                    form.excerpt.length > 140 ? "text-amber-400" : "text-text-muted"
                  )}
                >
                  {form.excerpt.length}/160
                </span>
              </div>
            </Field>

            <Field label="Cover image URL">
              <input
                type="url"
                value={form.cover_image}
                onChange={(e) => update("cover_image", e.target.value)}
                placeholder="https://…"
                className="w-full px-4 py-2.5 rounded-xl bg-bg-secondary border border-border text-text-primary placeholder:text-text-muted text-sm outline-none focus:border-accent-primary/50 transition-colors"
              />
              {form.cover_image && (
                <div className="mt-2 h-28 rounded-xl overflow-hidden border border-border">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={form.cover_image}
                    alt="Cover preview"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
            </Field>

            <Field label="Tags">
              <TagInput
                value={form.tags}
                onChange={(tags) => update("tags", tags)}
              />
            </Field>

            <Field label="Difficulty">
              <div className="flex gap-1 p-1 bg-bg-secondary rounded-xl border border-border">
                {DIFFICULTIES.map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => update("difficulty", d)}
                    className={cn(
                      "flex-1 py-1.5 rounded-lg text-xs font-mono capitalize transition-all",
                      form.difficulty === d
                        ? cn("border", DIFFICULTY_STYLE[d])
                        : "text-text-muted hover:text-text-secondary"
                    )}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </Field>

            <Field label="Status">
              <div className="flex gap-1 p-1 bg-bg-secondary rounded-xl border border-border">
                {STATUSES.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => update("status", s)}
                    className={cn(
                      "flex-1 py-1.5 rounded-lg text-xs font-mono capitalize transition-all",
                      form.status === s
                        ? cn("border", STATUS_STYLE[s])
                        : "text-text-muted hover:text-text-secondary"
                    )}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </Field>

            <Field label="Reading time">
              <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-bg-secondary border border-border">
                <Clock className="w-3.5 h-3.5 text-text-muted shrink-0" />
                <span className="font-mono text-sm text-text-secondary">
                  {readTime} min read
                </span>
                <span className="font-mono text-xs text-text-muted ml-1">
                  (auto-calculated)
                </span>
              </div>
            </Field>

            {form.status === "published" && (
              <Field label="Published date">
                <input
                  type="datetime-local"
                  value={form.published_at ? form.published_at.slice(0, 16) : ""}
                  onChange={(e) =>
                    update(
                      "published_at",
                      e.target.value ? new Date(e.target.value).toISOString() : ""
                    )
                  }
                  className="w-full px-4 py-2.5 rounded-xl bg-bg-secondary border border-border text-text-primary text-sm outline-none focus:border-accent-primary/50 transition-colors"
                />
              </Field>
            )}
          </div>
        </div>
      </div>

      <ToastContainer toasts={toasts} dismiss={dismiss} />
    </>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="font-mono text-xs text-text-muted uppercase tracking-wider">
        {label}
      </label>
      {children}
    </div>
  );
}
