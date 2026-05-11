import type { Metadata } from "next";
import { Card } from "@/components/ui";
import { Button } from "@/components/ui";
import { Plus, Pencil, Trash2 } from "lucide-react";

export const metadata: Metadata = { title: "Portfolio — Admin" };

const cases = [
  { id: "1", title: "Redesigning Onboarding for a B2B SaaS", industry: "B2B SaaS", outcome: "34% drop-off reduction", status: "published" },
  { id: "2", title: "Pricing Page A/B Test — 4 Weeks", industry: "Consumer", outcome: "77% lift in conversion", status: "published" },
  { id: "3", title: "From 0 to Internal Tool in 6 Weeks", industry: "E-commerce", outcome: "6h/week saved per PM", status: "published" },
  { id: "4", title: "Mobile Checkout Simplification (WIP)", industry: "Retail", outcome: "TBD", status: "draft" },
];

const statusColor = (s: string) =>
  s === "published"
    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
    : "bg-amber-500/10 text-amber-400 border-amber-500/20";

export default function AdminPortfolioPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-text-primary">Portfolio</h1>
          <p className="text-text-secondary text-sm mt-1">Manage case studies.</p>
        </div>
        <Button variant="primary">
          <Plus className="w-4 h-4 mr-2" />
          New Case Study
        </Button>
      </div>

      <Card className="divide-y divide-border">
        {cases.map((c) => (
          <div key={c.id} className="flex items-center gap-4 px-5 py-4 group hover:bg-white/[0.02] transition-colors">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-text-primary">{c.title}</p>
              <div className="flex items-center gap-3 mt-1">
                <span className="font-mono text-xs text-text-muted">{c.industry}</span>
                <span className="font-mono text-xs text-accent-primary">{c.outcome}</span>
              </div>
            </div>
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded text-2xs font-mono border ${statusColor(c.status)}`}
            >
              {c.status}
            </span>
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
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
