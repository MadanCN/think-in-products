import type { Metadata } from "next";
import { Badge } from "@/components/ui";
import { Card } from "@/components/ui";
import type { Article } from "@/types";

export const metadata: Metadata = {
  title: "Learn",
  description:
    "In-depth articles, frameworks, and PM teardowns — written for practitioners who want depth, not just surface-level tips.",
};

const featuredArticles: Article[] = [
  {
    id: "1",
    title: "How to Run a Discovery Sprint Without Annoying Engineers",
    slug: "discovery-sprint-without-annoying-engineers",
    excerpt:
      "Discovery is a team sport. Here's how to involve engineers early, build shared context, and avoid the 'just throw it over the wall' anti-pattern.",
    content: "",
    cover_image: null,
    author: "Think in Products",
    tags: ["discovery", "engineering", "collaboration"],
    difficulty: "intermediate",
    read_time_minutes: 8,
    published_at: "2024-03-15T00:00:00Z",
    status: "published",
  },
  {
    id: "2",
    title: "The Prioritisation Trap: Why More Frameworks Won't Save You",
    slug: "prioritisation-trap-frameworks",
    excerpt:
      "RICE, MoSCoW, WSJF — we have plenty of frameworks. What we lack is honest conversations about trade-offs. Here's how to fix that.",
    content: "",
    cover_image: null,
    author: "Think in Products",
    tags: ["prioritisation", "strategy", "decision-making"],
    difficulty: "intermediate",
    read_time_minutes: 6,
    published_at: "2024-03-08T00:00:00Z",
    status: "published",
  },
  {
    id: "3",
    title: "Writing for Alignment: The PRD Is a Conversation, Not a Contract",
    slug: "writing-for-alignment-prd",
    excerpt:
      "Most PRDs are written to prove the PM did their homework. The best ones are written to surface disagreements before they become expensive.",
    content: "",
    cover_image: null,
    author: "Think in Products",
    tags: ["writing", "alignment", "prd"],
    difficulty: "beginner",
    read_time_minutes: 5,
    published_at: "2024-03-01T00:00:00Z",
    status: "published",
  },
];

const difficultyColors: Record<string, string> = {
  beginner: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  intermediate: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  advanced: "bg-rose-500/10 text-rose-400 border-rose-500/20",
};

export default function LearnPage() {
  return (
    <div className="min-h-screen pt-32 pb-24 px-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-16 space-y-4">
          <Badge variant="outline" className="font-mono text-accent-secondary border-accent-secondary/30">
            Articles & Frameworks
          </Badge>
          <h1 className="font-display text-4xl md:text-5xl font-bold text-text-primary">
            Learn Product Thinking
          </h1>
          <p className="text-text-secondary text-lg max-w-2xl leading-relaxed">
            Not another listicle. These are practitioner-grade pieces — written for people who want to actually understand the work, not just name-drop frameworks in interviews.
          </p>
        </div>

        <div className="space-y-6">
          {featuredArticles.map((article) => (
            <Card key={article.id} className="p-6 group cursor-pointer hover:border-border-glow transition-all duration-200">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-2xs font-mono font-medium border ${difficultyColors[article.difficulty] ?? ""}`}
                    >
                      {article.difficulty}
                    </span>
                    {article.tags.slice(0, 2).map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center px-2 py-0.5 rounded text-2xs font-mono font-medium bg-bg-secondary border border-border text-text-muted"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                  <h2 className="font-display text-xl font-bold text-text-primary group-hover:text-accent-primary transition-colors mb-2">
                    {article.title}
                  </h2>
                  <p className="text-text-secondary text-sm leading-relaxed">
                    {article.excerpt}
                  </p>
                </div>
                <div className="shrink-0 text-right space-y-1">
                  <p className="font-mono text-xs text-text-muted">{article.read_time_minutes} min</p>
                  <p className="font-mono text-xs text-text-muted">
                    {new Date(article.published_at).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
