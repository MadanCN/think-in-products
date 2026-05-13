"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Badge, Button } from "@/components/ui";
import type { PublicCase } from "@/app/actions/portfolio";

interface Props {
  cases: PublicCase[];
}

export default function PortfolioTeaser({ cases }: Props) {
  if (cases.length === 0) return null;

  return (
    <section className="py-24 px-6">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12"
        >
          <div className="space-y-3">
            <Badge variant="outline" className="font-mono text-accent-primary border-accent-primary/30">
              Portfolio
            </Badge>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-text-primary">
              Work I&rsquo;m proud of
            </h2>
            <p className="text-text-secondary max-w-xl leading-relaxed">
              Documented case studies from real product work — the problem,
              what I tried, and what I actually learned.
            </p>
          </div>
          <Button variant="outline" size="md" href="/portfolio">
            See All Work
            <ArrowRight className="w-4 h-4" />
          </Button>
        </motion.div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {cases.map((c, i) => (
            <motion.div
              key={c.id}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }}
            >
              <Link href={`/portfolio/${c.slug}`} className="group block h-full">
                <div className="relative h-full rounded-2xl border border-border bg-bg-card/60 overflow-hidden hover:border-accent-primary/30 hover:-translate-y-1 transition-all duration-300">

                  {/* Cover */}
                  {c.cover_image_url ? (
                    <div className="relative h-48 overflow-hidden">
                      <Image
                        src={c.cover_image_url}
                        alt={c.title}
                        fill
                        sizes="(max-width: 768px) 100vw, 50vw"
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                        placeholder="blur"
                        blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-bg-card/80 to-transparent" />
                    </div>
                  ) : (
                    <div className="h-36 bg-gradient-to-br from-accent-primary/8 to-accent-secondary/8 flex items-center justify-center border-b border-border">
                      <span className="font-display text-5xl font-extrabold text-accent-primary/15 select-none">
                        {c.title.charAt(0)}
                      </span>
                    </div>
                  )}

                  <div className="p-6">
                    {/* Tags */}
                    {c.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {c.tags.slice(0, 3).map((tag) => (
                          <span
                            key={tag}
                            className="font-mono text-xs px-2 py-0.5 rounded bg-bg-secondary border border-border text-text-muted"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Title */}
                    <h3 className="font-display text-xl font-bold text-text-primary mb-2 group-hover:text-accent-primary transition-colors line-clamp-2">
                      {c.title}
                    </h3>

                    {/* Company / role */}
                    {(c.company || c.role) && (
                      <p className="text-text-muted text-sm mb-4 font-mono">
                        {[c.role, c.company].filter(Boolean).join(" · ")}
                      </p>
                    )}

                    {/* Key metrics */}
                    {c.metrics.length > 0 && (
                      <div className="flex gap-6 pt-4 border-t border-border">
                        {c.metrics.slice(0, 2).map((m, j) => (
                          <div key={j}>
                            <p className="font-display text-xl font-extrabold text-accent-primary leading-none">
                              {m.value}
                            </p>
                            <p className="font-mono text-xs text-text-muted mt-0.5">{m.label}</p>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* CTA hint */}
                    <div className="flex items-center gap-1.5 mt-4 text-text-muted text-sm group-hover:text-accent-primary transition-colors">
                      <span>Read case study</span>
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
}
