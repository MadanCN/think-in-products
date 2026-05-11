import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Building2, CalendarDays, Figma, Tag } from "lucide-react";
import { createServerAnonClient } from "@/lib/supabase";
import { MetricCard } from "@/components/portfolio/MetricCard";
import MarkdownRenderer from "@/components/portfolio/MarkdownRenderer";
import { CaseStudySidebar } from "@/components/portfolio/CaseStudySidebar";
import { PortfolioCTA } from "@/components/portfolio/PortfolioCTA";
import type { PortfolioCaseDB } from "@/types";

export const revalidate = 3600;

// ─── Data helpers ────────────────────────────────────────────────────────────

async function getCase(slug: string): Promise<PortfolioCaseDB | null> {
  try {
    const supabase = createServerAnonClient();
    const { data, error } = await supabase
      .from("portfolio_cases")
      .select("*")
      .eq("slug", slug)
      .eq("status", "published")
      .single();
    if (error || !data) return null;
    return data as PortfolioCaseDB;
  } catch {
    return null;
  }
}

export async function generateStaticParams() {
  try {
    const supabase = createServerAnonClient();
    const { data } = await supabase
      .from("portfolio_cases")
      .select("slug")
      .eq("status", "published");
    return (data ?? []).map((row: { slug: string }) => ({ slug: row.slug }));
  } catch {
    return [];
  }
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const c = await getCase(params.slug);
  if (!c) return { title: "Case Study Not Found" };
  return {
    title: c.title,
    description: c.problem ?? undefined,
    openGraph: {
      title: c.title,
      description: c.problem ?? undefined,
      images: c.cover_image_url ? [{ url: c.cover_image_url }] : [],
    },
  };
}

// ─── Section anchor wrapper ───────────────────────────────────────────────────

function Section({
  id,
  label,
  children,
}: {
  id: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-28">
      <h2 className="font-display text-xl font-bold text-text-primary mb-5 flex items-center gap-3">
        <span className="w-1 h-5 rounded-full bg-accent-primary shrink-0" />
        {label}
      </h2>
      {children}
    </section>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function CaseStudyPage({
  params,
}: {
  params: { slug: string };
}) {
  const c = await getCase(params.slug);
  if (!c) notFound();

  return (
    <div className="min-h-screen pt-28 pb-24 px-6">
      <div className="max-w-6xl mx-auto">

        {/* Mobile back link */}
        <div className="lg:hidden mb-8">
          <Link
            href="/portfolio"
            className="inline-flex items-center gap-1.5 text-text-muted hover:text-text-primary transition-colors font-mono text-xs group"
          >
            <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5" />
            All work
          </Link>
        </div>

        {/* Cover image */}
        {c.cover_image_url && (
          <div className="relative w-full h-[300px] md:h-[440px] rounded-3xl overflow-hidden mb-10 border border-white/5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={c.cover_image_url}
              alt={c.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-bg-primary/60 to-transparent" />
          </div>
        )}

        {/* Two-column layout: sidebar + main */}
        <div className="flex gap-16">
          {/* Sticky sidebar — desktop only */}
          <CaseStudySidebar />

          {/* Main content */}
          <article className="flex-1 min-w-0">

            {/* Header */}
            <header className="mb-10">
              {/* Tags */}
              <div className="flex flex-wrap gap-2 mb-4">
                {c.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 font-mono text-xs px-2.5 py-1 rounded-lg border border-border bg-bg-secondary text-text-muted"
                  >
                    <Tag className="w-3 h-3" />
                    {tag}
                  </span>
                ))}
              </div>

              {/* Title */}
              <h1 className="font-display text-3xl md:text-4xl font-extrabold text-text-primary leading-tight mb-5">
                {c.title}
              </h1>

              {/* Meta row */}
              <div className="flex flex-wrap items-center gap-4 text-sm font-mono text-text-muted">
                {(c.company || c.role) && (
                  <span className="flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 shrink-0" />
                    {[c.company, c.role].filter(Boolean).join(" · ")}
                  </span>
                )}
                {c.timeline && (
                  <span className="flex items-center gap-1.5">
                    <CalendarDays className="w-3.5 h-3.5 shrink-0" />
                    {c.timeline}
                  </span>
                )}
                {c.figma_url && (
                  <a
                    href={c.figma_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-text-muted hover:text-accent-primary transition-colors"
                  >
                    <Figma className="w-3.5 h-3.5 shrink-0" />
                    View in Figma
                  </a>
                )}
              </div>
            </header>

            {/* Metrics bar */}
            {c.metrics.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-12">
                {c.metrics.map((m) => (
                  <MetricCard key={m.label} label={m.label} value={m.value} />
                ))}
              </div>
            )}

            {/* Divider */}
            <hr className="border-border mb-12" />

            {/* Content sections */}
            <div className="flex flex-col gap-14">
              {c.problem && (
                <Section id="problem" label="The Problem">
                  <div className="pl-5 pr-4 py-5 border-l-4 border-accent-primary bg-accent-primary/5 rounded-r-2xl">
                    <p className="text-text-primary text-[15px] leading-[1.85] font-medium">
                      {c.problem}
                    </p>
                  </div>
                </Section>
              )}

              {c.approach && (
                <Section id="approach" label="The Approach">
                  <MarkdownRenderer content={c.approach} variant="article" />
                </Section>
              )}

              {c.outcome && (
                <Section id="outcome" label="Outcome">
                  <MarkdownRenderer content={c.outcome} variant="article" />
                </Section>
              )}

              {c.learnings && (
                <Section id="learnings" label="Learnings">
                  <MarkdownRenderer content={c.learnings} variant="article" />
                </Section>
              )}
            </div>

            {/* CTA */}
            <PortfolioCTA />
          </article>
        </div>
      </div>
    </div>
  );
}
