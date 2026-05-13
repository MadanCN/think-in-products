"use client";

import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Button, Badge } from "@/components/ui";
import type { RoadmapStats } from "@/app/actions/roadmap";

const HeroCanvas = dynamic(() => import("@/components/3d/HeroCanvas"), { ssr: false });

// ─── Scroll indicator (animated drop-line, matches reference) ─
function ScrollHint() {
  return (
    <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2">
      <span
        className="font-mono text-[0.7rem] tracking-[0.14em] uppercase"
        style={{ color: "var(--color-text-muted, #7a7d94)" }}
      >
        Scroll
      </span>
      <motion.div
        className="w-px bg-gradient-to-b from-current to-transparent"
        style={{ height: 50, color: "var(--color-text-muted, #7a7d94)", originY: 0 }}
        animate={{ scaleY: [0, 1, 1, 0] }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut",
          times: [0, 0.5, 0.51, 1],
        }}
      />
    </div>
  );
}

// ─── Stats block — absolute bottom-right (matches reference) ──
function HeroStats({ stats }: { stats?: RoadmapStats }) {
  const items = [
    ...(stats?.nodeCount    ? [{ value: String(stats.nodeCount),       label: "Topics"    }] : []),
    ...(stats?.resourceCount ? [{ value: `${stats.resourceCount}+`,    label: "Resources" }] : []),
    { value: "Free", label: "Forever" },
  ];

  return (
    <div className="absolute right-16 bottom-16 z-10 hidden lg:flex flex-col gap-6 items-end">
      {items.map(({ value, label }) => (
        <div key={label} className="text-right">
          <p
            className="font-display font-extrabold leading-none"
            style={{ fontSize: "clamp(1.8rem, 2.5vw, 2.4rem)", color: "var(--color-text-primary, #e8e9f0)" }}
          >
            {value}
          </p>
          <p
            className="font-mono uppercase tracking-[0.08em] mt-1"
            style={{ fontSize: "0.72rem", color: "var(--color-text-muted, #7a7d94)" }}
          >
            {label}
          </p>
        </div>
      ))}
    </div>
  );
}

// ─── Stagger variants ─────────────────────────────────────────
const container = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12, delayChildren: 0.05 } },
};
const fadeUp = {
  hidden:  { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } },
};

// ─── Main ─────────────────────────────────────────────────────
export default function HeroSection({ stats }: { stats?: RoadmapStats }) {
  return (
    <section
      className="relative min-h-screen flex flex-col justify-center overflow-hidden px-6 md:px-16 pt-16"
      style={{ backgroundColor: "var(--bg-primary, #07080f)" }}
    >
      {/* Three.js canvas background */}
      <HeroCanvas />

      {/* Subtle noise overlay — matches reference feel */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ zIndex: 1, backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E\")", opacity: 0.35 }}
      />

      {/* Content */}
      <motion.div
        className="relative z-10 max-w-5xl pb-16 lg:pb-0"
        variants={container}
        initial="hidden"
        animate="visible"
      >
        {/* Badge */}
        <motion.div variants={fadeUp} className="mb-8">
          <Badge
            variant="solid"
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs"
          >
            <span className="w-[6px] h-[6px] rounded-full bg-accent-primary animate-pulse" />
            Learning in Public · Startup PM · Documentation
          </Badge>
        </motion.div>

        {/* Headline — mixed typography, exactly like reference */}
        <motion.h1
          variants={fadeUp}
          className="font-display font-extrabold leading-[0.95] tracking-[-0.03em] mb-6"
          style={{ fontSize: "clamp(2.25rem, 8vw, 7rem)" }}
        >
          <span className="block text-text-primary">Products</span>
          <span className="block text-text-primary">don&rsquo;t fail.</span>
          <span className="block italic text-accent-primary">Assumptions</span>
          <span className="block text-text-muted">do.</span>
        </motion.h1>

        {/* Sub */}
        <motion.p
          variants={fadeUp}
          className="text-text-secondary leading-[1.75] mb-12 font-light"
          style={{ fontSize: "1.05rem", maxWidth: "480px", fontWeight: 300 }}
        >
          Real notes from a startup PM — what I&rsquo;m learning, testing, and
          documenting as I go.
        </motion.p>

        {/* CTAs */}
        <motion.div variants={fadeUp} className="flex flex-col sm:flex-row items-start gap-4">
          <Button variant="primary" size="lg" href="/roadmap">
            Explore Roadmap
            <ArrowRight className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="lg" href="/portfolio">
            See My Work
          </Button>
        </motion.div>

        {/* Mobile stats row */}
        {stats && (stats.nodeCount > 0 || stats.resourceCount > 0) && (
          <motion.div
            variants={fadeUp}
            className="lg:hidden flex items-center gap-8 mt-12 pt-8 border-t border-border/40"
          >
            {stats.nodeCount > 0 && (
              <div>
                <p className="font-display text-2xl font-extrabold text-text-primary">{stats.nodeCount}</p>
                <p className="font-mono text-xs text-text-muted uppercase tracking-wider">Topics</p>
              </div>
            )}
            {stats.resourceCount > 0 && (
              <div>
                <p className="font-display text-2xl font-extrabold text-text-primary">{stats.resourceCount}+</p>
                <p className="font-mono text-xs text-text-muted uppercase tracking-wider">Resources</p>
              </div>
            )}
            <div>
              <p className="font-display text-2xl font-extrabold text-accent-primary">Free</p>
              <p className="font-mono text-xs text-text-muted uppercase tracking-wider">Forever</p>
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* Stats — desktop bottom-right */}
      <HeroStats stats={stats} />

      {/* Scroll indicator — bottom-center */}
      <ScrollHint />
    </section>
  );
}
