"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PortfolioCaseSummary } from "@/types";

const CARD_GRADIENTS = [
  "from-accent-primary/15 via-bg-card to-accent-secondary/10",
  "from-accent-secondary/15 via-bg-card to-rose-900/10",
  "from-amber-900/15 via-bg-card to-accent-primary/10",
  "from-violet-900/15 via-bg-card to-accent-primary/10",
];

interface CaseStudyCardProps {
  caseStudy: PortfolioCaseSummary;
  index: number;
}

export function CaseStudyCard({ caseStudy, index }: CaseStudyCardProps) {
  const gradient = CARD_GRADIENTS[index % CARD_GRADIENTS.length];

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ duration: 0.35, delay: index * 0.05, ease: [0.22, 1, 0.36, 1] }}
      className="group relative rounded-3xl overflow-hidden border border-white/5 bg-bg-card/60 flex flex-col"
    >
      {/* Cover image or gradient */}
      <div className="relative h-44 overflow-hidden">
        {caseStudy.cover_image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={caseStudy.cover_image_url}
            alt={caseStudy.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div
            className={cn(
              "w-full h-full bg-gradient-to-br",
              gradient,
              "transition-transform duration-500 group-hover:scale-105"
            )}
          />
        )}

        {/* Hover overlay with CTA */}
        <div className="absolute inset-0 bg-bg-primary/0 group-hover:bg-bg-primary/60 transition-all duration-300 flex items-center justify-center">
          <span className="opacity-0 group-hover:opacity-100 transition-all duration-200 translate-y-2 group-hover:translate-y-0 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-accent-primary text-bg-primary text-sm font-semibold">
            Read Case Study
            <ArrowRight className="w-4 h-4" />
          </span>
        </div>
      </div>

      {/* Card body */}
      <div className="flex flex-col gap-3 p-5 flex-1">
        {/* Company */}
        {caseStudy.company && (
          <div className="flex items-center gap-1.5 text-text-muted">
            <Building2 className="w-3 h-3 shrink-0" />
            <span className="font-mono text-xs">{caseStudy.company}</span>
            {caseStudy.role && (
              <>
                <span className="text-border">·</span>
                <span className="font-mono text-xs">{caseStudy.role}</span>
              </>
            )}
          </div>
        )}

        {/* Title */}
        <h3 className="font-display text-base font-bold text-text-primary group-hover:text-accent-primary transition-colors leading-snug">
          {caseStudy.title}
        </h3>

        {/* Problem excerpt */}
        {caseStudy.problem && (
          <p className="text-text-secondary text-sm leading-relaxed line-clamp-2 flex-1">
            {caseStudy.problem}
          </p>
        )}

        {/* Tags */}
        <div className="flex flex-wrap gap-1.5 pt-1">
          {caseStudy.tags.slice(0, 4).map((tag) => (
            <span
              key={tag}
              className="font-mono text-2xs px-2 py-0.5 rounded-md bg-bg-secondary border border-border text-text-muted"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* Full-card link */}
      <Link
        href={`/portfolio/${caseStudy.slug}`}
        className="absolute inset-0"
        aria-label={`Read case study: ${caseStudy.title}`}
      />
    </motion.article>
  );
}
