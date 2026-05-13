"use client";

import { motion } from "framer-motion";
import { ArrowRight, Clock } from "lucide-react";
import { Card, Badge, Button } from "@/components/ui";
import type { AdminArticle } from "@/app/actions/articles";

const difficultyColors: Record<string, string> = {
  beginner: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  intermediate: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  advanced: "bg-rose-500/10 text-rose-400 border-rose-500/20",
};

interface Props {
  articles: AdminArticle[];
}

export default function FeaturedArticles({ articles }: Props) {
  if (articles.length === 0) return null;

  return (
    <section className="py-24 px-6 bg-bg-secondary/30">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div className="space-y-3">
            <Badge variant="outline" className="font-mono text-accent-secondary border-accent-secondary/30">
              Recent Writing
            </Badge>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-text-primary">
              From the blog
            </h2>
            <p className="text-text-secondary max-w-xl leading-relaxed">
              Practitioner-grade pieces on discovery, strategy, and execution. No listicles, no SEO filler.
            </p>
          </div>
          <Button variant="outline" size="md" href="/learn">
            All Articles
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {articles.map((article, i) => (
            <motion.div
              key={article.slug}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }}
            >
              <Card glow className="p-6 h-full flex flex-col gap-4 cursor-pointer group">
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded text-2xs font-mono border ${difficultyColors[article.difficulty] ?? ""}`}
                  >
                    {article.difficulty}
                  </span>
                  {article.tags.slice(0, 1).map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center px-2 py-0.5 rounded text-2xs font-mono border border-border bg-bg-secondary text-text-muted"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                <h3 className="font-display text-lg font-bold text-text-primary group-hover:text-accent-primary transition-colors flex-1">
                  {article.title}
                </h3>
                <p className="text-text-secondary text-sm leading-relaxed">{article.excerpt}</p>
                <div className="flex items-center gap-1.5 text-text-muted">
                  <Clock className="w-3 h-3" />
                  <span className="font-mono text-xs">{article.read_time_minutes} min read</span>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
