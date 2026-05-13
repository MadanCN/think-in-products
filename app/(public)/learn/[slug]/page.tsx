import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Clock, Calendar, User } from "lucide-react";
import {
  getArticleBySlug,
  getRelatedArticles,
  getPublishedArticleSlugs,
} from "@/app/actions/articles";
import { generateMeta } from "@/lib/metadata";
import { ReadingProgressBar } from "@/components/learn/ReadingProgressBar";
import { ArticleSubscribeCTA } from "@/components/learn/ArticleSubscribeCTA";
import { ArticleCard } from "@/components/learn/ArticleCard";
import MarkdownRenderer from "@/components/portfolio/MarkdownRenderer";

export const revalidate = 3600;

// ─── SSG ─────────────────────────────────────────────────────────────────────

export async function generateStaticParams() {
  try {
    const slugs = await getPublishedArticleSlugs();
    return slugs.map((slug) => ({ slug }));
  } catch {
    return [];
  }
}

// ─── Per-article SEO ──────────────────────────────────────────────────────────

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const article = await getArticleBySlug(params.slug);
  if (!article) return { title: "Article Not Found" };

  return generateMeta({
    title: article.title,
    description: article.excerpt ?? undefined,
    image: article.cover_image,
    path: `/learn/${article.slug}`,
    type: "article",
    publishedTime: article.published_at,
    modifiedTime: article.updated_at,
    authors: [article.author],
    tags: article.tags,
  });
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmtDate(iso: string | null): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function ArticlePage({
  params,
}: {
  params: { slug: string };
}) {
  const article = await getArticleBySlug(params.slug);
  if (!article) notFound();

  const related = await getRelatedArticles(article.id, article.tags, 2);

  return (
    <>
      <ReadingProgressBar />

      <div className="min-h-screen pt-28 pb-28 px-6">
        <div className="max-w-3xl mx-auto">

          {/* Back */}
          <Link
            href="/learn"
            className="inline-flex items-center gap-1.5 font-mono text-xs text-text-muted hover:text-text-primary transition-colors group mb-10"
          >
            <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5" />
            All articles
          </Link>

          {/* Article header */}
          <header className="mb-10">
            {/* Tags */}
            {article.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-5">
                {article.tags.map((tag) => (
                  <Link
                    key={tag}
                    href={`/learn?tag=${encodeURIComponent(tag)}`}
                    className="font-mono text-xs px-2.5 py-1 rounded-lg border border-border bg-bg-secondary text-text-muted hover:text-accent-primary hover:border-accent-primary/30 transition-colors capitalize"
                  >
                    {tag}
                  </Link>
                ))}
              </div>
            )}

            {/* Title */}
            <h1 className="font-display text-3xl md:text-4xl font-extrabold text-text-primary leading-tight mb-5">
              {article.title}
            </h1>

            {/* Excerpt */}
            {article.excerpt && (
              <p className="text-text-secondary text-lg leading-relaxed mb-6">
                {article.excerpt}
              </p>
            )}

            {/* Meta row */}
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 font-mono text-xs text-text-muted">
              <span className="flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 shrink-0" />
                {article.author}
              </span>
              {article.published_at && (
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 shrink-0" />
                  {fmtDate(article.published_at)}
                </span>
              )}
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 shrink-0" />
                {article.read_time_minutes} min read
              </span>
            </div>
          </header>

          {/* Cover image */}
          {article.cover_image && (
            <div className="w-full h-72 md:h-[440px] rounded-3xl overflow-hidden border border-border/50 mb-12 animate-[fadeIn_0.6s_ease_both]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={article.cover_image}
                alt={article.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* Article body */}
          <article className="mb-4">
            {article.content ? (
              <MarkdownRenderer content={article.content} variant="article" />
            ) : (
              <p className="text-text-muted italic font-mono text-sm">
                No content yet.
              </p>
            )}
          </article>

          {/* Subscribe CTA */}
          <ArticleSubscribeCTA />

          {/* Related articles */}
          {related.length > 0 && (
            <section className="mt-4">
              <h2 className="font-display text-xl font-bold text-text-primary mb-6 flex items-center gap-3">
                <span className="w-1 h-5 rounded-full bg-accent-primary shrink-0" />
                More articles
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {related.map((a) => (
                  <ArticleCard key={a.id} article={a} />
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </>
  );
}
