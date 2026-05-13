import Link from "next/link";
import { ArrowRight, Clock, Calendar } from "lucide-react";
import type { AdminArticle } from "@/app/actions/articles";

function fmtDate(iso: string | null): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function FeaturedArticle({ article }: { article: AdminArticle }) {
  return (
    <Link href={`/learn/${article.slug}`} className="group block mb-14">
      <article className="rounded-3xl border border-border bg-bg-card overflow-hidden hover:border-border-glow hover:shadow-[0_0_32px_rgba(0,229,204,0.07)] transition-all duration-300 md:flex min-h-[280px]">

        {/* Cover */}
        <div className="md:w-[45%] relative h-56 md:h-auto overflow-hidden shrink-0">
          {article.cover_image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={article.cover_image}
              alt={article.title}
              className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-accent-primary/20 via-accent-secondary/10 to-transparent flex items-center justify-center">
              <span className="font-mono text-xs text-accent-primary/40 uppercase tracking-[0.2em]">
                Featured
              </span>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-bg-card/30 hidden md:block" />
        </div>

        {/* Content */}
        <div className="flex-1 p-8 md:p-10 xl:p-12 flex flex-col justify-center gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-[11px] font-semibold text-accent-primary uppercase tracking-widest border border-accent-primary/30 bg-accent-primary/10 px-2.5 py-0.5 rounded-md">
              Featured
            </span>
            {article.tags.slice(0, 2).map((tag) => (
              <span
                key={tag}
                className="font-mono text-[11px] px-2.5 py-0.5 rounded-md border border-border bg-bg-secondary text-text-muted capitalize"
              >
                {tag}
              </span>
            ))}
          </div>

          <h2 className="font-display text-2xl md:text-[1.75rem] font-extrabold text-text-primary leading-tight group-hover:text-accent-primary transition-colors">
            {article.title}
          </h2>

          {article.excerpt && (
            <p className="text-text-secondary leading-relaxed text-[15px] line-clamp-3">
              {article.excerpt}
            </p>
          )}

          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center gap-5 font-mono text-xs text-text-muted">
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 shrink-0" />
                {article.read_time_minutes} min read
              </span>
              {article.published_at && (
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 shrink-0" />
                  {fmtDate(article.published_at)}
                </span>
              )}
            </div>

            <span className="flex items-center gap-1.5 text-sm font-semibold text-accent-primary group-hover:gap-3 transition-all duration-200">
              Read <ArrowRight className="w-4 h-4" />
            </span>
          </div>
        </div>
      </article>
    </Link>
  );
}
