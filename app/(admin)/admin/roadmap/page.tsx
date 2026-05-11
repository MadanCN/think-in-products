import type { Metadata } from "next";
import { Card } from "@/components/ui";
import { Button } from "@/components/ui";
import { Badge } from "@/components/ui";
import { Plus, GripVertical, Pencil, Trash2 } from "lucide-react";

export const metadata: Metadata = { title: "Roadmap — Admin" };

const nodes = [
  { id: "n1", title: "What is Product Management?", phase: "Phase 1", type: "concept", status: "published", hours: 2 },
  { id: "n2", title: "Discovery Fundamentals", phase: "Phase 1", type: "skill", status: "published", hours: 4 },
  { id: "n3", title: "Writing PRDs That Get Built", phase: "Phase 1", type: "skill", status: "published", hours: 3 },
  { id: "n4", title: "Prioritisation Frameworks", phase: "Phase 2", type: "framework", status: "published", hours: 3 },
  { id: "n5", title: "Metrics & Success Criteria", phase: "Phase 2", type: "skill", status: "published", hours: 4 },
  { id: "n6", title: "Cross-functional Collaboration", phase: "Phase 2", type: "soft-skill", status: "draft", hours: 3 },
  { id: "n7", title: "Product Strategy Primer", phase: "Phase 3", type: "concept", status: "draft", hours: 5 },
  { id: "n8", title: "Competitive Analysis", phase: "Phase 3", type: "framework", status: "draft", hours: 3 },
];

const statusColor = (s: string) =>
  s === "published"
    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
    : "bg-text-muted/10 text-text-muted border-text-muted/20";

export default function AdminRoadmapPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-text-primary">Roadmap</h1>
          <p className="text-text-secondary text-sm mt-1">Manage nodes and phases.</p>
        </div>
        <Button variant="primary">
          <Plus className="w-4 h-4 mr-2" />
          Add Node
        </Button>
      </div>

      <Card className="divide-y divide-border">
        {nodes.map((node) => (
          <div key={node.id} className="flex items-center gap-4 px-5 py-3 group hover:bg-white/[0.02] transition-colors">
            <GripVertical className="w-4 h-4 text-text-muted shrink-0 cursor-grab" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono text-xs text-text-muted">{node.phase}</span>
                <span className="text-text-muted text-xs">·</span>
                <span className="text-sm text-text-primary font-medium">{node.title}</span>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" size="sm">{node.type}</Badge>
                <span className="font-mono text-xs text-text-muted">~{node.hours}h</span>
              </div>
            </div>
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded text-2xs font-mono border ${statusColor(node.status)}`}
            >
              {node.status}
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
