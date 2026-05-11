import type { Metadata } from "next";
import { createServerAnonClient } from "@/lib/supabase";
import { PortfolioClient } from "@/components/portfolio/PortfolioClient";
import type { PortfolioCaseSummary } from "@/types";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Portfolio",
  description:
    "Real product case studies — structured discovery, trade-off decisions, and outcome analysis for aspiring PMs building their portfolios.",
};

async function getCases(): Promise<PortfolioCaseSummary[]> {
  try {
    const supabase = createServerAnonClient();
    const { data, error } = await supabase
      .from("portfolio_cases")
      .select(
        "id,title,slug,company,role,tags,problem,cover_image_url,metrics,is_featured,order_index"
      )
      .eq("status", "published")
      .order("order_index", { ascending: true });
    if (error) throw error;
    return (data as PortfolioCaseSummary[]) ?? [];
  } catch {
    return [];
  }
}

export default async function PortfolioPage() {
  const cases = await getCases();

  const featured = cases.find((c) => c.is_featured) ?? null;
  const grid = cases.filter((c) => !c.is_featured || featured?.id !== c.id);

  const allTags = Array.from(
    new Set(cases.flatMap((c) => c.tags))
  ).sort();

  return (
    <div className="min-h-screen pt-32 pb-24 px-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-14 space-y-4">
          <span className="inline-block font-mono text-xs px-3 py-1 rounded-full border border-accent-primary/30 bg-accent-primary/10 text-accent-primary font-semibold">
            Case Studies
          </span>
          <h1 className="font-display text-4xl md:text-5xl font-extrabold text-text-primary">
            Product Portfolio
          </h1>
          <p className="text-text-secondary text-lg max-w-2xl leading-relaxed">
            Annotated case studies showing the full product lifecycle — discovery, framing,
            trade-off decisions, and honest outcome reporting.
          </p>
        </div>

        {cases.length === 0 ? (
          <div className="py-32 text-center text-text-muted font-mono text-sm">
            Case studies coming soon.
          </div>
        ) : (
          <PortfolioClient featured={featured} cases={grid} allTags={allTags} />
        )}
      </div>
    </div>
  );
}
