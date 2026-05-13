import type { Metadata } from "next";
import { Badge } from "@/components/ui";
import {
  getPublishedArticles,
  getAllPublishedTags,
} from "@/app/actions/articles";
import { FeaturedArticle } from "@/components/learn/FeaturedArticle";
import { ArticlesGrid } from "@/components/learn/ArticlesGrid";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Learn",
  description:
    "In-depth articles, frameworks, and PM teardowns — written for practitioners who want depth, not just surface-level tips.",
  openGraph: {
    title: "Learn Product Management",
    description:
      "In-depth articles, frameworks, and PM teardowns — written for practitioners who want depth, not just surface-level tips.",
    url: `${process.env.NEXT_PUBLIC_SITE_URL ?? ""}/learn`,
  },
};

const GRID_SIZE = 9;

export default async function LearnPage() {
  const [initial, allTags] = await Promise.all([
    getPublishedArticles({ offset: 0, limit: GRID_SIZE + 1 }),
    getAllPublishedTags(),
  ]);

  const featured = initial.articles[0] ?? null;
  const gridArticles = initial.articles.slice(1);
  // Total for the grid = all published articles minus the featured slot
  const gridTotal = Math.max(0, initial.total - 1);
  // Next offset for load-more: we've shown 1 featured + up to GRID_SIZE grid articles
  const initialNextOffset = 1 + gridArticles.length;

  return (
    <div className="min-h-screen pt-32 pb-28 px-6">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="mb-14 max-w-2xl">
          <Badge
            variant="outline"
            className="font-mono text-accent-secondary border-accent-secondary/30 mb-4"
          >
            Articles &amp; Frameworks
          </Badge>
          <h1 className="font-display text-4xl md:text-5xl font-bold text-text-primary leading-tight mb-4">
            Learn Product Management
          </h1>
          <p className="text-text-secondary text-lg leading-relaxed">
            Practitioner-grade pieces — written for people who want to actually
            understand the work, not just name-drop frameworks in interviews.
          </p>
        </div>

        {/* Featured article */}
        {featured && <FeaturedArticle article={featured} />}

        {/* Empty state (no published articles at all) */}
        {!featured && initial.total === 0 && (
          <div className="py-24 text-center">
            <p className="font-mono text-sm text-text-muted">
              No articles published yet — check back soon.
            </p>
          </div>
        )}

        {/* Grid with tag filter + load more */}
        {initial.total > 1 && (
          <ArticlesGrid
            initialArticles={gridArticles}
            initialTotal={gridTotal}
            initialNextOffset={initialNextOffset}
            allTags={allTags}
          />
        )}
      </div>
    </div>
  );
}
