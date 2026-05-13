"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Map } from "lucide-react";
import { Card, Badge, Button } from "@/components/ui";
import type { PublicPhasePreview } from "@/app/actions/roadmap";

interface Props {
  phases: PublicPhasePreview[];
}

export default function RoadmapPreview({ phases }: Props) {
  const visible = phases.slice(0, 2);

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
              Structured Path
            </Badge>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-text-primary">
              Here&rsquo;s what I&rsquo;ve learnt
            </h2>
            <p className="text-text-secondary max-w-xl leading-relaxed">
              My structured notes on product work, organised by phase. Each module
              is documented as I learn it — not a reading list, a knowledge base
              built in public.
            </p>
          </div>
          <Button variant="outline" size="md" href="/roadmap">
            View Full Roadmap
            <ArrowRight className="w-4 h-4" />
          </Button>
        </motion.div>

        {visible.length > 0 ? (
          /* Horizontal scroll on mobile, 2-col grid on desktop */
          <div className="flex md:grid md:grid-cols-2 gap-5 overflow-x-auto md:overflow-visible -mx-6 px-6 md:mx-0 md:px-0 pb-3 md:pb-0">
            {visible.map((phase, i) => (
              <motion.div
                key={phase.id}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }}
                className="min-w-[280px] md:min-w-0 shrink-0 md:shrink"
              >
                <Link href="/roadmap" className="block h-full group">
                  <Card glow className="p-6 h-full flex flex-col gap-5 transition-colors group-hover:border-accent-primary/40">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold" style={{ color: phase.color }}>
                        Phase {String(phase.order_index).padStart(2, "0")}
                      </span>
                      <ArrowRight className="w-3.5 h-3.5 text-text-muted opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                    </div>
                    <h3 className="font-display text-xl font-bold text-text-primary">
                      {phase.title}
                    </h3>
                    <ul className="space-y-2 flex-1">
                      {phase.nodes.map((node) => (
                        <li
                          key={node.title}
                          className="flex items-start gap-2 text-sm text-text-secondary"
                        >
                          <span className="mt-1.5 w-1 h-1 rounded-full bg-border shrink-0" />
                          {node.title}
                        </li>
                      ))}
                    </ul>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-col items-center gap-4 py-16 text-center rounded-2xl border border-border/50 bg-bg-card/30"
          >
            <div className="w-14 h-14 rounded-2xl bg-accent-primary/10 border border-accent-primary/20 flex items-center justify-center">
              <Map className="w-6 h-6 text-accent-primary" strokeWidth={1.5} />
            </div>
            <div className="space-y-1.5">
              <p className="font-display text-lg font-bold text-text-primary">Coming Soon</p>
              <p className="text-text-muted text-sm max-w-xs">
                The roadmap is being built out. Check back soon.
              </p>
            </div>
          </motion.div>
        )}

      </div>
    </section>
  );
}
