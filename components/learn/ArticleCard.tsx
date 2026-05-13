import Link from "next/link";
import { Clock, Calendar } from "lucide-react";
import type { AdminArticle } from "@/app/actions/articles";
import { cn } from "@/lib/utils";

const TAG_GRADIENT: Record<string, string> = {
  strategy:      "from-violet-500/30 to-indigo-500/10",
  discovery:     "from-teal-500/30 to-cyan-500/10",
  engineering:   "from-blue-500/30 to-sky-500/10",
  prioritisation:"from-amber-500/30 to-orange-500/10",
  writing:       "from-rose-500/30 to-pink-500/10",
  alignment:     "from-emerald-500/30 to-green-500/10",
  metrics:       "from-purple-500/30 to-violet-500/10",
  research:      "from-cyan-500/30 to-teal-500/10",
};
const FALLBACK_GRADIENT = "from-accent-primary/20 to-accent-secondary/10";

function coverGradient(tags: string[]): string {
  for (const t of tags) {
    if (TAG_GRADIENT[t]) return TAG_GRADIENT[t];
  }
  return FALLBACK_GRADIENT;
}

function fmtDate(iso: string | null): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function ArticleCard({ article }: { article: AdminArticle }) {
  return (
    <Link href={`/learn/${article.slug}`} className="group block h-full">
      <article className="h-full flex flex-col rounded-2xl border border-border bg-bg-card overflow-hidden hover:border-border-glow hover:shadow-[0_0_24px_rgba(0,229,204,0.06)] transition-all duration-300">

        {/* Cover */}
        <div className="relative h-44 overflow-hidden shrink-0">
          {article.cover_image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={article.cover_image}
              alt={article.title}
              className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-500"
            />
          ) : (
            <div className={cn("w-full h-full bg-gradient-to-br", coverGradient(article.tags))} />
          )}
          {/* Difficulty badge */}
          <span className={cn(
            "absolute top-3 left-3 font-mono text-[10px] font-semibold px-2 py-0.5 rounded-md border",
            article.difficulty === "beginner"     && "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
            article.difficulty === "intermediate" && "bg-amber-500/20  text-amber-300  border-amber-500/30",
            article.difficulty === "advanced"     && "bg-rose-500/20   text-rose-300   border-rose-500/30",
          )}>
            {article.difficulty}
          </span>
        </div>

        {/* Body */}
        <div className="flex flex-col flex-1 p-5 gap-3">
          {/* Tags */}
          {article.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {article.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="font-mono text-[10px] px-2 py-0.5 rounded-md border border-border bg-bg-secondary text-text-muted capitalize"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Title */}
          <h3 className="font-display font-bold text-text-primary text-base leading-snug group-hover:text-accent-primary transition-colors line-clamp-2">
            {article.title}
          </h3>

          {/* Excerpt */}
          {article.excerpt && (
            <p className="text-text-muted text-sm leading-relaxed line-clamp-2 flex-1">
              {article.excerpt}
            </p>
          )}

          {/* Meta */}
          <div className="flex items-center gap-4 mt-auto pt-1">
            <span className="flex items-center gap-1.5 font-mono text-xs text-text-muted">
              <Clock className="w-3 h-3 shrink-0" />
              {article.read_time_minutes} min
            </span>
            {article.published_at && (
              <span className="flex items-center gap-1.5 font-mono text-xs text-text-muted">
                <Calendar className="w-3 h-3 shrink-0" />
                {fmtDate(article.published_at)}
              </span>
            )}
          </div>
        </div>
      </article>
    </Link>
  );
}
