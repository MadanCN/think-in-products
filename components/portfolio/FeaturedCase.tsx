"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Building2, Star } from "lucide-react";
import { MetricCard } from "./MetricCard";
import type { PortfolioCaseSummary } from "@/types";

export function FeaturedCase({ caseStudy }: { caseStudy: PortfolioCaseSummary }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="group relative rounded-3xl overflow-hidden border border-white/5 bg-bg-card/60 mb-10"
    >
      {/* Background */}
      <div className="relative h-[320px] md:h-[400px] overflow-hidden">
        {caseStudy.cover_image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={caseStudy.cover_image_url}
            alt={caseStudy.title}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-accent-primary/20 via-bg-secondary to-accent-secondary/20 transition-transform duration-700 group-hover:scale-105" />
        )}

        {/* Dark gradient overlay — bottom half */}
        <div className="absolute inset-0 bg-gradient-to-t from-bg-primary via-bg-primary/70 to-transparent" />

        {/* Content overlaid at bottom */}
        <div className="absolute bottom-0 left-0 right-0 p-7 md:p-10">
          {/* Featured badge */}
          <div className="flex items-center gap-2 mb-4">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent-primary/15 border border-accent-primary/30 text-accent-primary font-mono text-xs font-semibold">
              <Star className="w-3 h-3 fill-accent-primary" />
              Featured Case Study
            </span>
          </div>

          {/* Company + role */}
          {(caseStudy.company || caseStudy.role) && (
            <div className="flex items-center gap-1.5 text-text-muted mb-2">
              <Building2 className="w-3.5 h-3.5 shrink-0" />
              <span className="font-mono text-sm">
                {[caseStudy.company, caseStudy.role].filter(Boolean).join(" · ")}
              </span>
            </div>
          )}

          {/* Title */}
          <h2 className="font-display text-2xl md:text-3xl font-extrabold text-text-primary group-hover:text-accent-primary transition-colors leading-tight mb-3 max-w-2xl">
            {caseStudy.title}
          </h2>

          {/* Problem excerpt */}
          {caseStudy.problem && (
            <p className="text-text-secondary text-sm leading-relaxed max-w-xl mb-6 line-clamp-2">
              {caseStudy.problem}
            </p>
          )}

          {/* Tags */}
          <div className="flex flex-wrap gap-2 mb-6">
            {caseStudy.tags.map((tag) => (
              <span
                key={tag}
                className="font-mono text-xs px-2.5 py-1 rounded-lg bg-bg-primary/60 border border-border text-text-muted"
              >
                {tag}
              </span>
            ))}
          </div>

          {/* CTA */}
          <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-accent-primary text-bg-primary text-sm font-semibold group-hover:bg-accent-primary/90 transition-colors">
            Read Case Study
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
          </div>
        </div>
      </div>

      {/* Metrics bar — shown below if metrics exist */}
      {caseStudy.metrics.length > 0 && (
        <div className="px-7 md:px-10 py-6 border-t border-border/50 grid grid-cols-2 sm:grid-cols-4 gap-4">
          {caseStudy.metrics.map((m) => (
            <MetricCard key={m.label} label={m.label} value={m.value} />
          ))}
        </div>
      )}

      {/* Full-card link */}
      <Link
        href={`/portfolio/${caseStudy.slug}`}
        className="absolute inset-0"
        aria-label={`Read case study: ${caseStudy.title}`}
      />
    </motion.div>
  );
}
