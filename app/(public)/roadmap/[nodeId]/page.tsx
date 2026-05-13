import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  Clock, ArrowLeft, ChevronLeft, ChevronRight,
  BookOpen, FileText, Play, Wrench, ExternalLink,
} from "lucide-react";
import { createServerAnonClient } from "@/lib/supabase";
import type { RoadmapPhaseDB, RoadmapNodeDB, NodeResource } from "@/types";
import { cn } from "@/lib/utils";

export const revalidate = 0;

// ─── Data helpers ─────────────────────────────────────────────────────────────

interface NodeWithDesc extends RoadmapNodeDB {
  description: string | null;
}

interface PageData {
  node: NodeWithDesc;
  phase: RoadmapPhaseDB;
  prev: { id: string; title: string } | null;
  next: { id: string; title: string } | null;
}

async function getData(nodeId: string): Promise<PageData | null> {
  const supabase = createServerAnonClient();

  // Fetch full roadmap to get ordering
  const { data: phases, error } = await supabase.rpc("get_roadmap_with_nodes") as { data: RoadmapPhaseDB[] | null; error: unknown };
  if (error || !phases) return null;

  // Fetch the node's full description (not included in RPC response)
  const { data: nodeRow } = await supabase
    .from("roadmap_nodes")
    .select("description")
    .eq("id", nodeId)
    .eq("is_published", true)
    .maybeSingle();

  // Flat ordered list of all nodes
  const flat: Array<{ node: RoadmapNodeDB; phase: RoadmapPhaseDB }> = phases.flatMap((p) =>
    p.nodes.map((n) => ({ node: n, phase: p }))
  );

  const idx = flat.findIndex((x) => x.node.id === nodeId);
  if (idx === -1) return null;

  const { node, phase } = flat[idx];
  const prev = idx > 0 ? { id: flat[idx - 1].node.id, title: flat[idx - 1].node.title } : null;
  const next = idx < flat.length - 1 ? { id: flat[idx + 1].node.id, title: flat[idx + 1].node.title } : null;

  return {
    node: { ...node, description: nodeRow?.description ?? null },
    phase,
    prev,
    next,
  };
}

// ─── Metadata ─────────────────────────────────────────────────────────────────

export async function generateMetadata({ params }: { params: { nodeId: string } }): Promise<Metadata> {
  const data = await getData(params.nodeId);
  if (!data) return { title: "Module not found" };
  return {
    title: data.node.title,
    description: data.node.summary,
  };
}

// ─── Icons ────────────────────────────────────────────────────────────────────

const RESOURCE_ICONS: Record<NodeResource["type"], React.ElementType> = {
  book: BookOpen, article: FileText, video: Play, tool: Wrench,
};
const RESOURCE_COLORS: Record<NodeResource["type"], string> = {
  book:    "text-amber-400  bg-amber-400/10  border-amber-400/20",
  article: "text-sky-400    bg-sky-400/10    border-sky-400/20",
  video:   "text-rose-400   bg-rose-400/10   border-rose-400/20",
  tool:    "text-violet-400 bg-violet-400/10 border-violet-400/20",
};
const DIFFICULTY_STYLES: Record<string, string> = {
  beginner:     "bg-emerald-500/10 text-emerald-400 border-emerald-500/25",
  intermediate: "bg-amber-500/10   text-amber-400   border-amber-500/25",
  advanced:     "bg-rose-500/10    text-rose-400    border-rose-500/25",
};
const MD_COMPONENTS: React.ComponentProps<typeof ReactMarkdown>["components"] = {
  h2: ({ children }) => (
    <h2 className="font-display text-2xl font-bold text-text-primary mt-10 mb-3 first:mt-0">{children}</h2>
  ),
  h3: ({ children }) => (
    <h3 className="font-display text-lg font-semibold text-text-primary mt-7 mb-2">{children}</h3>
  ),
  p: ({ children }) => <p className="text-text-secondary text-base leading-[1.8] mb-5">{children}</p>,
  ul: ({ children }) => <ul className="space-y-2 mb-5 pl-1">{children}</ul>,
  li: ({ children }) => (
    <li className="flex items-start gap-2.5 text-text-secondary text-base">
      <span className="mt-2.5 w-1.5 h-1.5 rounded-full bg-accent-primary shrink-0" />
      <span className="leading-[1.7]">{children}</span>
    </li>
  ),
  strong: ({ children }) => <strong className="font-semibold text-text-primary">{children}</strong>,
  code: ({ children }) => (
    <code className="font-mono text-sm bg-bg-secondary border border-border px-1.5 py-0.5 rounded text-accent-primary">
      {children}
    </code>
  ),
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function NodeDetailPage({ params }: { params: { nodeId: string } }) {
  const data = await getData(params.nodeId);
  if (!data) notFound();

  const { node, phase, prev, next } = data;

  return (
    <div className="min-h-screen">
      <div className="max-w-3xl mx-auto px-6 pt-28 pb-24">

        {/* Back */}
        <Link
          href="/roadmap"
          className="inline-flex items-center gap-2 text-sm text-text-muted hover:text-accent-primary transition-colors mb-8 group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          Back to Roadmap
        </Link>

        {/* Phase label */}
        <div className="flex items-center gap-2 mb-4">
          <span
            className="font-mono text-xs font-bold px-2.5 py-0.5 rounded-full border"
            style={{ color: phase.color, borderColor: `${phase.color}40`, background: `${phase.color}15` }}
          >
            {phase.title}
          </span>
        </div>

        {/* Title & meta */}
        <h1 className="font-display text-3xl md:text-4xl font-extrabold text-text-primary leading-tight mb-4">
          {node.title}
        </h1>

        <div className="flex flex-wrap items-center gap-3 mb-8">
          <span className={cn("inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-mono font-semibold border", DIFFICULTY_STYLES[node.difficulty])}>
            {node.difficulty}
          </span>
          <span className="flex items-center gap-1.5 font-mono text-sm text-text-muted">
            <Clock className="w-3.5 h-3.5" strokeWidth={1.5} />
            ~{node.estimated_hours}h
          </span>
          {node.tags.map((tag) => (
            <span key={tag} className="font-mono text-xs px-2 py-0.5 rounded bg-bg-secondary border border-border text-text-muted">
              {tag}
            </span>
          ))}
        </div>

        {/* Divider */}
        <div className="h-px bg-border mb-10" />

        {/* Description */}
        <article className="prose-custom">
          {node.description ? (
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={MD_COMPONENTS}>
              {node.description}
            </ReactMarkdown>
          ) : (
            <p className="text-text-muted italic">Full content coming soon.</p>
          )}
        </article>

        {/* Resources */}
        {node.resources.length > 0 && (
          <div className="mt-10">
            <h2 className="font-mono text-xs text-text-muted uppercase tracking-widest mb-4">Resources</h2>
            <ul className="space-y-2.5">
              {node.resources.map((res, i) => {
                const Icon = RESOURCE_ICONS[res.type] ?? FileText;
                const colorClass = RESOURCE_COLORS[res.type] ?? RESOURCE_COLORS.article;
                return (
                  <li key={i}>
                    <a
                      href={res.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex items-center gap-3 p-3.5 rounded-xl bg-bg-card/60 border border-border hover:border-accent-primary/30 hover:bg-bg-card transition-all"
                    >
                      <span className={cn("shrink-0 w-8 h-8 rounded-lg flex items-center justify-center border", colorClass)}>
                        <Icon className="w-4 h-4" strokeWidth={1.8} />
                      </span>
                      <span className="flex-1 min-w-0 text-sm text-text-secondary group-hover:text-text-primary transition-colors truncate">
                        {res.label}
                      </span>
                      <ExternalLink className="shrink-0 w-4 h-4 text-text-muted group-hover:text-accent-primary transition-colors" />
                    </a>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {/* Prev / Next */}
        <div className="mt-12 pt-8 border-t border-border grid grid-cols-2 gap-4">
          <div>
            {prev && (
              <Link
                href={`/roadmap/${prev.id}`}
                className="group flex flex-col gap-1 p-4 rounded-xl border border-border hover:border-accent-primary/30 bg-bg-card/40 hover:bg-bg-card transition-all"
              >
                <span className="flex items-center gap-1.5 font-mono text-xs text-text-muted group-hover:text-accent-primary transition-colors">
                  <ChevronLeft className="w-3.5 h-3.5" />
                  Previous
                </span>
                <span className="text-sm font-semibold text-text-primary line-clamp-2 leading-snug">
                  {prev.title}
                </span>
              </Link>
            )}
          </div>
          <div className="flex justify-end">
            {next && (
              <Link
                href={`/roadmap/${next.id}`}
                className="group flex flex-col gap-1 p-4 rounded-xl border border-border hover:border-accent-primary/30 bg-bg-card/40 hover:bg-bg-card transition-all text-right w-full"
              >
                <span className="flex items-center justify-end gap-1.5 font-mono text-xs text-text-muted group-hover:text-accent-primary transition-colors">
                  Next
                  <ChevronRight className="w-3.5 h-3.5" />
                </span>
                <span className="text-sm font-semibold text-text-primary line-clamp-2 leading-snug">
                  {next.title}
                </span>
              </Link>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
