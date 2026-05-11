"use client";

import dynamic from "next/dynamic";
import { Suspense } from "react";
import { motion } from "framer-motion";
import { ArrowRight, ChevronDown } from "lucide-react";
import { Button, Badge } from "@/components/ui";
import { useMediaQuery } from "@/hooks/useMediaQuery";

// Loaded only client-side — Three.js must never run on the server
const HeroScene = dynamic(() => import("@/components/3d/HeroScene"), {
  ssr: false,
  loading: () => <SceneLoader />,
});

// ─── CSS spinner shown while canvas bootstraps ────────────────
function SceneLoader() {
  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="w-8 h-8 rounded-full border-2 border-accent-primary/20 border-t-accent-primary animate-spin" />
    </div>
  );
}

// ─── Static fallback for mobile (no WebGL overhead) ──────────
function StaticMesh() {
  return (
    <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
      <div className="absolute top-[-10%] left-[-10%] w-[60vw] h-[60vw] rounded-full bg-accent-primary/6 blur-[120px] animate-pulse-glow" />
      <div
        className="absolute bottom-[-5%] right-[-5%] w-[50vw] h-[50vw] rounded-full bg-accent-secondary/7 blur-[100px] animate-pulse-glow"
        style={{ animationDelay: "1.5s" }}
      />
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[40vw] h-[40vw] rounded-full bg-accent-primary/4 blur-[80px] animate-pulse-glow"
        style={{ animationDelay: "3s" }}
      />
    </div>
  );
}

// ─── Scroll indicator ─────────────────────────────────────────
function ScrollIndicator() {
  return (
    <motion.div
      className="flex flex-col items-center gap-1.5"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 1.8, duration: 0.6 }}
    >
      <span className="font-mono text-2xs text-text-muted tracking-widest uppercase">
        scroll
      </span>
      <motion.div
        animate={{ y: [0, 6, 0] }}
        transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
      >
        <ChevronDown className="w-5 h-5 text-text-muted" strokeWidth={1.5} />
      </motion.div>
    </motion.div>
  );
}

// ─── Stats bar ────────────────────────────────────────────────
function StatsBar() {
  const stats = ["16 Topics", "60+ Resources", "Free Forever"];

  return (
    <motion.div
      className="w-full border-t border-border/40"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 1.4, duration: 0.6 }}
    >
      <div className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-center gap-0">
        {stats.map((stat, i) => (
          <span key={stat} className="flex items-center">
            <span className="font-mono text-sm text-text-secondary px-6">{stat}</span>
            {i < stats.length - 1 && (
              <span className="w-px h-4 bg-accent-primary/30 shrink-0" />
            )}
          </span>
        ))}
      </div>
    </motion.div>
  );
}

// ─── Stagger variants ─────────────────────────────────────────
const container = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.18, delayChildren: 0.1 } },
};
const item = {
  hidden: { opacity: 0, y: 22 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } },
};

// ─── Main export ──────────────────────────────────────────────
export default function HeroSection() {
  const isDesktop = useMediaQuery("(min-width: 768px)");

  return (
    <div className="flex flex-col">
      {/* ── Full-viewport hero ── */}
      <section className="relative min-h-screen flex flex-col overflow-hidden">

        {/* Background layer: 3D canvas on desktop, static mesh on mobile */}
        <div className="absolute inset-0 z-0">
          {isDesktop ? (
            <Suspense fallback={<SceneLoader />}>
              <HeroScene />
            </Suspense>
          ) : (
            <StaticMesh />
          )}
        </div>

        {/* Radial vignette — keeps text readable against the 3D scene */}
        <div
          className="absolute inset-0 z-[1] pointer-events-none"
          aria-hidden="true"
          style={{
            background:
              "radial-gradient(ellipse 80% 60% at 50% 50%, transparent 30%, rgba(8,12,20,0.55) 100%)",
          }}
        />

        {/* Bottom fade into next section */}
        <div
          className="absolute bottom-0 left-0 right-0 h-40 z-[1] pointer-events-none"
          aria-hidden="true"
          style={{
            background: "linear-gradient(to top, #080C14 0%, transparent 100%)",
          }}
        />

        {/* ── Centred content overlay ── */}
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 pt-24 pb-12">
          <motion.div
            className="text-center max-w-3xl mx-auto space-y-7"
            variants={container}
            initial="hidden"
            animate="visible"
          >
            {/* Eyebrow badge */}
            <motion.div variants={item}>
              <Badge
                variant="solid"
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-accent-primary animate-pulse" />
                Product Management · Learning · Portfolio
              </Badge>
            </motion.div>

            {/* Headline */}
            <motion.h1
              variants={item}
              className="font-display text-5xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-text-primary leading-[1.06] text-balance"
            >
              Think Like a<br />
              <span className="text-accent-primary text-glow">
                Product Manager.
              </span>
            </motion.h1>

            {/* Sub-headline */}
            <motion.p
              variants={item}
              className="text-text-secondary text-lg md:text-xl leading-relaxed max-w-xl mx-auto text-balance"
            >
              A no-fluff roadmap to PM fundamentals. Built by a PM, for aspiring PMs.
            </motion.p>

            {/* CTAs */}
            <motion.div
              variants={item}
              className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-1"
            >
              <Button variant="primary" size="lg" href="/roadmap">
                Explore Roadmap
                <ArrowRight className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="lg" href="/portfolio">
                See My Work
              </Button>
            </motion.div>
          </motion.div>
        </div>

        {/* Scroll cue */}
        <div className="relative z-10 flex justify-center pb-10">
          <ScrollIndicator />
        </div>
      </section>

      {/* ── Stats bar (below the fold) ── */}
      <StatsBar />
    </div>
  );
}
