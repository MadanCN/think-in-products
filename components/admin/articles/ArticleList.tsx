"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Trash2, ExternalLink } from "lucide-react";
import Link from "next/link";
import { DataTable } from "@/components/admin/DataTable";
import { ConfirmModal } from "@/components/admin/ConfirmModal";
import { useToast, ToastContainer } from "@/components/admin/Toast";
import { deleteArticle } from "@/app/actions/articles";
import type { AdminArticle } from "@/app/actions/articles";
import type { Column } from "@/components/admin/DataTable";
import { cn } from "@/lib/utils";

type FilterTab = "all" | "published" | "draft" | "archived";

const STATUS_STYLE: Record<string, string> = {
  published: "bg-emerald-500/15 text-emerald-400 border-emerald-500/25",
  draft: "bg-bg-secondary text-text-muted border-border",
  archived: "bg-amber-500/15 text-amber-400 border-amber-500/25",
};

interface ArticleListProps {
  initialArticles: AdminArticle[];
}

export function ArticleList({ initialArticles }: ArticleListProps) {
  const [articles, setArticles] = useState(initialArticles);
  const [tab, setTab] = useState<FilterTab>("all");
  const [search, setSearch] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<AdminArticle | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const { toasts, toast, dismiss } = useToast();
  const router = useRouter();

  const filtered = articles.filter((a) => {
    const matchesTab = tab === "all" || a.status === tab;
    const matchesSearch = a.title.toLowerCase().includes(search.toLowerCase());
    return matchesTab && matchesSearch;
  });

  async function handleDelete() {
    if (!confirmDelete) return;
    setDeleteLoading(true);
    try {
      await deleteArticle(confirmDelete.id);
      setArticles((prev) => prev.filter((a) => a.id !== confirmDelete.id));
      toast({ message: "Article deleted" });
    } catch {
      toast({ message: "Failed to delete article", type: "error" });
    } finally {
      setDeleteLoading(false);
      setConfirmDelete(null);
    }
  }

  const tabs: { key: FilterTab; label: string }[] = [
    { key: "all", label: `All (${articles.length})` },
    { key: "published", label: `Published (${articles.filter((a) => a.status === "published").length})` },
    { key: "draft", label: `Draft (${articles.filter((a) => a.status === "draft").length})` },
    { key: "archived", label: `Archived (${articles.filter((a) => a.status === "archived").length})` },
  ];

  const columns: Column<AdminArticle>[] = [
    {
      key: "title",
      label: "Title",
      sortable: true,
      render: (a) => (
        <div className="flex flex-col gap-0.5">
          <span className="text-text-primary font-medium text-sm leading-snug">
            {a.title}
          </span>
          <span className="font-mono text-2xs text-text-muted">{a.slug}</span>
        </div>
      ),
    },
    {
      key: "status",
      label: "Status",
      width: "110px",
      render: (a) => (
        <span
          className={cn(
            "inline-flex items-center px-2 py-0.5 rounded-md text-2xs font-mono border capitalize",
            STATUS_STYLE[a.status]
          )}
        >
          {a.status}
        </span>
      ),
    },
    {
      key: "tags",
      label: "Tags",
      render: (a) => (
        <div className="flex flex-wrap gap-1">
          {a.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center px-1.5 py-0.5 rounded-md text-2xs font-mono bg-bg-secondary border border-border text-text-muted"
            >
              {tag}
            </span>
          ))}
          {a.tags.length > 3 && (
            <span className="text-2xs font-mono text-text-muted">
              +{a.tags.length - 3}
            </span>
          )}
        </div>
      ),
    },
    {
      key: "read_time_minutes",
      label: "Read time",
      sortable: true,
      width: "100px",
      render: (a) => (
        <span className="font-mono text-xs text-text-muted">
          {a.read_time_minutes} min
        </span>
      ),
    },
    {
      key: "published_at",
      label: "Published",
      sortable: true,
      width: "130px",
      render: (a) => (
        <span className="font-mono text-xs text-text-muted">
          {a.published_at
            ? new Date(a.published_at).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })
            : "—"}
        </span>
      ),
    },
    {
      key: "id",
      label: "Actions",
      width: "110px",
      render: (a) => (
        <div
          className="flex items-center gap-1"
          onClick={(e) => e.stopPropagation()}
        >
          {a.status === "published" && (
            <a
              href={`/learn/${a.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 rounded-lg hover:bg-white/5 text-text-muted hover:text-text-primary transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
          <Link
            href={`/admin/articles/${a.id}`}
            className="p-1.5 rounded-lg hover:bg-white/5 text-text-muted hover:text-text-primary transition-colors"
          >
            <Pencil className="w-3.5 h-3.5" />
          </Link>
          <button
            onClick={() => setConfirmDelete(a)}
            className="p-1.5 rounded-lg hover:bg-rose-500/10 text-text-muted hover:text-rose-400 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <>
      <div className="space-y-5">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-1 p-1 bg-bg-secondary rounded-xl border border-border">
            {tabs.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={cn(
                  "px-3 py-1.5 rounded-lg font-mono text-xs transition-all whitespace-nowrap",
                  tab === t.key
                    ? "bg-bg-card text-text-primary shadow-sm border border-border"
                    : "text-text-muted hover:text-text-secondary"
                )}
              >
                {t.label}
              </button>
            ))}
          </div>
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search articles…"
            className="px-4 py-2 rounded-xl bg-bg-secondary border border-border text-text-primary placeholder:text-text-muted text-sm outline-none focus:border-accent-primary/50 transition-colors w-60"
          />
        </div>

        <DataTable<AdminArticle>
          columns={columns}
          data={filtered}
          rowKey={(a) => a.id}
          onRowClick={(a) => router.push(`/admin/articles/${a.id}`)}
          emptyMessage={
            search
              ? `No articles match "${search}"`
              : tab === "all"
              ? "No articles yet. Create your first one."
              : `No ${tab} articles.`
          }
        />
      </div>

      <ConfirmModal
        open={!!confirmDelete}
        title="Delete article?"
        message={`"${confirmDelete?.title}" will be permanently deleted.`}
        loading={deleteLoading}
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(null)}
      />

      <ToastContainer toasts={toasts} dismiss={dismiss} />
    </>
  );
}
