import type { Metadata } from "next";
import { Card } from "@/components/ui";
import { Button } from "@/components/ui";
import { Badge } from "@/components/ui";
import { Plus, Pencil, Trash2, Eye } from "lucide-react";

export const metadata: Metadata = { title: "Articles — Admin" };

const articles = [
  { id: "1", title: "How to Run a Discovery Sprint Without Annoying Engineers", slug: "discovery-sprint", tags: ["discovery", "engineering"], difficulty: "intermediate", readTime: 8, status: "published", publishedAt: "2024-03-15" },
  { id: "2", title: "The Prioritisation Trap: Why More Frameworks Won't Save You", slug: "prioritisation-trap", tags: ["prioritisation", "strategy"], difficulty: "intermediate", readTime: 6, status: "published", publishedAt: "2024-03-08" },
  { id: "3", title: "Writing for Alignment: The PRD Is a Conversation, Not a Contract", slug: "prd-as-conversation", tags: ["writing", "alignment"], difficulty: "beginner", readTime: 5, status: "published", publishedAt: "2024-03-01" },
  { id: "4", title: "How to Measure Discovery Quality (draft)", slug: "measure-discovery-quality", tags: ["discovery", "metrics"], difficulty: "advanced", readTime: 0, status: "draft", publishedAt: "" },
];

const statusColor = (s: string) =>
  s === "published"
    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
    : "bg-amber-500/10 text-amber-400 border-amber-500/20";

export default function AdminArticlesPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-text-primary">Articles</h1>
          <p className="text-text-secondary text-sm mt-1">Write and manage published content.</p>
        </div>
        <Button variant="primary">
          <Plus className="w-4 h-4 mr-2" />
          New Article
        </Button>
      </div>

      <Card className="divide-y divide-border">
        {articles.map((a) => (
          <div key={a.id} className="flex items-center gap-4 px-5 py-4 group hover:bg-white/[0.02] transition-colors">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-text-primary truncate">{a.title}</p>
              <div className="flex items-center gap-2 mt-1">
                {a.tags.slice(0, 2).map((t) => (
                  <Badge key={t} variant="outline" size="sm">{t}</Badge>
                ))}
                {a.readTime > 0 && (
                  <span className="font-mono text-xs text-text-muted">{a.readTime} min read</span>
                )}
                {a.publishedAt && (
                  <span className="font-mono text-xs text-text-muted">{a.publishedAt}</span>
                )}
              </div>
            </div>
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded text-2xs font-mono border ${statusColor(a.status)}`}
            >
              {a.status}
            </span>
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button className="p-1.5 rounded hover:bg-white/5 text-text-muted hover:text-text-primary transition-colors">
                <Eye className="w-3.5 h-3.5" />
              </button>
              <button className="p-1.5 rounded hover:bg-white/5 text-text-muted hover:text-text-primary transition-colors">
                <Pencil className="w-3.5 h-3.5" />
              </button>
              <button className="p-1.5 rounded hover:bg-rose-500/10 text-text-muted hover:text-rose-400 transition-colors">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </Card>
    </div>
  );
}
