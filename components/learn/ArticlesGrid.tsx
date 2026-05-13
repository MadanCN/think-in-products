"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { getPublishedArticles } from "@/app/actions/articles";
import type { AdminArticle } from "@/app/actions/articles";
import { ArticleCard } from "./ArticleCard";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 9;

interface Props {
  initialArticles: AdminArticle[];
  initialTotal: number;
  initialNextOffset: number;
  allTags: string[];
}

export function ArticlesGrid({
  initialArticles,
  initialTotal,
  initialNextOffset,
  allTags,
}: Props) {
  const [articles, setArticles] = useState(initialArticles);
  const [total, setTotal] = useState(initialTotal);
  const [nextOffset, setNextOffset] = useState(initialNextOffset);
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const hasMore = articles.length < total;

  async function handleTagClick(tag: string | null) {
    if (tag === activeTag) return;

    if (tag === null) {
      setArticles(initialArticles);
      setTotal(initialTotal);
      setNextOffset(initialNextOffset);
      setActiveTag(null);
      return;
    }

    setActiveTag(tag);
    setLoading(true);
    try {
      const result = await getPublishedArticles({ offset: 0, limit: PAGE_SIZE, tag });
      setArticles(result.articles);
      setTotal(result.total);
      setNextOffset(PAGE_SIZE);
    } finally {
      setLoading(false);
    }
  }

  async function handleLoadMore() {
    setLoading(true);
    try {
      const result = await getPublishedArticles({
        offset: nextOffset,
        limit: PAGE_SIZE,
        tag: activeTag ?? undefined,
      });
      setArticles((prev) => [...prev, ...result.articles]);
      setNextOffset((prev) => prev + PAGE_SIZE);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section>
      {/* Tag filter pills */}
      {allTags.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-2 mb-8 scrollbar-hide">
          <button
            onClick={() => handleTagClick(null)}
            className={cn(
              "shrink-0 px-4 py-1.5 rounded-full font-mono text-xs font-medium border transition-all",
              activeTag === null
                ? "bg-accent-primary text-bg-primary border-accent-primary"
                : "border-border text-text-muted hover:text-text-secondary hover:border-border-glow"
            )}
          >
            All
          </button>
          {allTags.map((tag) => (
            <button
              key={tag}
              onClick={() => handleTagClick(tag)}
              className={cn(
                "shrink-0 px-4 py-1.5 rounded-full font-mono text-xs font-medium border transition-all capitalize",
                activeTag === tag
                  ? "bg-accent-primary text-bg-primary border-accent-primary"
                  : "border-border text-text-muted hover:text-text-secondary hover:border-border-glow"
              )}
            >
              {tag}
            </button>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && articles.length === 0 && (
        <div className="py-20 text-center">
          <p className="font-mono text-sm text-text-muted">
            No articles found{activeTag ? ` tagged "${activeTag}"` : ""}.
          </p>
        </div>
      )}

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {articles.map((article) => (
          <ArticleCard key={article.id} article={article} />
        ))}
      </div>

      {/* Load more */}
      {(hasMore || loading) && (
        <div className="flex justify-center mt-12">
          <button
            onClick={handleLoadMore}
            disabled={loading}
            className="inline-flex items-center gap-2 px-7 py-2.5 rounded-xl border border-border text-text-secondary text-sm font-semibold hover:border-border-glow hover:text-text-primary transition-all disabled:opacity-50"
          >
            {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            {loading ? "Loading…" : "Load more articles"}
          </button>
        </div>
      )}
    </section>
  );
}
