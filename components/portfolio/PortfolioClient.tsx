"use client";

import { useState, useMemo } from "react";
import { AnimatePresence } from "framer-motion";
import { FeaturedCase } from "./FeaturedCase";
import { CaseStudyCard } from "./CaseStudyCard";
import { TagFilter } from "./TagFilter";
import type { PortfolioCaseSummary } from "@/types";

interface PortfolioClientProps {
  featured: PortfolioCaseSummary | null;
  cases: PortfolioCaseSummary[];
  allTags: string[];
}

export function PortfolioClient({ featured, cases, allTags }: PortfolioClientProps) {
  const [activeTag, setActiveTag] = useState<string | null>(null);

  const filteredCases = useMemo(() => {
    if (!activeTag) return cases;
    return cases.filter((c) => c.tags.includes(activeTag));
  }, [cases, activeTag]);

  return (
    <>
      {featured && !activeTag && <FeaturedCase caseStudy={featured} />}

      <div className="flex flex-col gap-6">
        <TagFilter tags={allTags} active={activeTag} onChange={setActiveTag} />

        {filteredCases.length === 0 ? (
          <div className="py-24 text-center text-text-muted font-mono text-sm">
            No case studies match &ldquo;{activeTag}&rdquo;.
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCases.map((c, i) => (
                <CaseStudyCard key={c.id} caseStudy={c} index={i} />
              ))}
            </div>
          </AnimatePresence>
        )}
      </div>
    </>
  );
}
