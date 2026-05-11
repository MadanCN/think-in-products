"use client";

import { motion } from "framer-motion";
import { ArrowRight, MessageSquare } from "lucide-react";
import Link from "next/link";

export function PortfolioCTA() {
  return (
    <motion.section
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      className="mt-20 rounded-3xl border border-accent-primary/20 bg-accent-primary/5 px-8 py-12 md:px-14 md:py-16 text-center relative overflow-hidden"
    >
      {/* Subtle glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[200px] bg-accent-primary/8 rounded-full blur-3xl" />
      </div>

      <div className="relative flex flex-col items-center gap-6">
        <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-accent-primary/30 bg-accent-primary/10 text-accent-primary font-mono text-xs font-semibold">
          <MessageSquare className="w-3 h-3" />
          Let&rsquo;s talk
        </span>

        <h2 className="font-display text-2xl md:text-3xl font-extrabold text-text-primary max-w-lg leading-tight">
          Want to work together or talk product?
        </h2>

        <p className="text-text-secondary text-sm leading-relaxed max-w-md">
          I&rsquo;m open to conversations about product strategy, mentorship, and interesting problems worth solving.
        </p>

        <Link
          href="/contact"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-accent-primary text-bg-primary text-sm font-semibold hover:bg-accent-primary/90 transition-colors"
        >
          Get in touch
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </motion.section>
  );
}
