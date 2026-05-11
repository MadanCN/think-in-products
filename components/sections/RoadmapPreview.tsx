"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Clock } from "lucide-react";
import { Card, Badge, Button } from "@/components/ui";

const phases = [
  {
    number: "01",
    title: "Foundations",
    nodes: ["What is Product Management?", "Discovery Fundamentals", "Writing PRDs That Get Built"],
    status: "published" as const,
  },
  {
    number: "02",
    title: "Execution",
    nodes: ["Prioritisation Frameworks", "Metrics & Success Criteria", "Cross-functional Collaboration"],
    status: "published" as const,
  },
  {
    number: "03",
    title: "Strategy",
    nodes: ["Product Strategy Primer", "Competitive Analysis"],
    status: "coming_soon" as const,
  },
];

export default function RoadmapPreview() {
  return (
    <section className="py-24 px-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div className="space-y-3">
            <Badge variant="outline" className="font-mono text-accent-primary border-accent-primary/30">
              Structured Path
            </Badge>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-text-primary">
              The PM Roadmap
            </h2>
            <p className="text-text-secondary max-w-xl leading-relaxed">
              Three phases. Focused modules. No busywork. Each node is a tight, opinionated piece of work — not a reading list.
            </p>
          </div>
          <Button variant="outline" size="md" href="/roadmap">
            View Full Roadmap
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>

        {/* Phase cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {phases.map((phase, i) => (
            <motion.div
              key={phase.number}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }}
            >
              <Card glow className="p-6 h-full flex flex-col gap-5">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-accent-primary">
                    Phase {phase.number}
                  </span>
                  {phase.status === "coming_soon" ? (
                    <span className="flex items-center gap-1 font-mono text-2xs text-text-muted">
                      <Clock className="w-3 h-3" /> coming soon
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 font-mono text-2xs text-emerald-400">
                      <CheckCircle2 className="w-3 h-3" /> live
                    </span>
                  )}
                </div>
                <h3 className="font-display text-xl font-bold text-text-primary">
                  {phase.title}
                </h3>
                <ul className="space-y-2 flex-1">
                  {phase.nodes.map((node) => (
                    <li
                      key={node}
                      className="flex items-start gap-2 text-sm text-text-secondary"
                    >
                      <span className="mt-1.5 w-1 h-1 rounded-full bg-border shrink-0" />
                      {node}
                    </li>
                  ))}
                </ul>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
