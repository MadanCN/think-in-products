"use client";

import { motion, useReducedMotion } from "motion/react";
import { renderInline } from "@/lib/markdown";
import type { Credit, ImageBlock, SourcesBlock, StatsBlock, TimelineBlock, TipBlock } from "@/lib/types";

export function CreditLine({ credit, creditUrl }: Partial<Credit>) {
  if (!credit) return null;
  return (
    <span className="credit">
      {" "}
      Image: {creditUrl ? <a href={creditUrl} target="_blank" rel="noopener noreferrer">{credit}</a> : credit}
    </span>
  );
}

export function Figure({ block }: { block: ImageBlock }) {
  if (!block.src) return null;
  return (
    <figure className="figure">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={block.src} alt={block.alt} loading="lazy" decoding="async" />
      {block.caption || block.credit ? (
        <figcaption>
          {block.caption}
          <CreditLine credit={block.credit} creditUrl={block.creditUrl} />
        </figcaption>
      ) : null}
    </figure>
  );
}

/* TiP: Think in Products tip. A practical thing to do at work. */
export function Tip({ block }: { block: TipBlock }) {
  return (
    <aside className="tip" aria-label="Think in Products tip">
      <div className="tip-badge" aria-hidden="true">
        <span>T</span>
        <span className="tip-i">i</span>
        <span>P</span>
      </div>
      <div>
        <p className="tip-kicker">Think in Products tip</p>
        {block.title ? <p className="tip-title">{block.title}</p> : null}
        <p className="tip-text" dangerouslySetInnerHTML={{ __html: renderInline(block.text) }} />
      </div>
    </aside>
  );
}

export function Stats({ block }: { block: StatsBlock }) {
  const reduce = useReducedMotion();
  const items = block.items.filter((i) => i.value);
  return (
    <figure className="stats" style={{ margin: 0 }}>
      <div className="stats-grid" style={{ gridTemplateColumns: `repeat(${Math.min(items.length, 4)}, minmax(0, 1fr))` }}>
        {items.map((s, i) => (
          <motion.div
            key={i}
            className="stat"
            initial={reduce ? false : { opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.6 }}
            transition={{ delay: i * 0.12, duration: 0.45 }}
          >
            <span className="stat-value">{s.value}</span>
            <span className="stat-label">{s.label}</span>
          </motion.div>
        ))}
      </div>
      {block.source ? (
        <figcaption className="caption">
          Source: {block.sourceUrl ? <a href={block.sourceUrl} target="_blank" rel="noopener noreferrer">{block.source}</a> : block.source}
        </figcaption>
      ) : null}
    </figure>
  );
}

/* Timeline: the line draws down and each event appears as you scroll. */
export function Timeline({ block }: { block: TimelineBlock }) {
  const reduce = useReducedMotion();
  const events = block.events.filter((e) => e.title || e.date);
  return (
    <section className="timeline" aria-label={block.title || "Timeline"}>
      {block.title ? <h3 className="timeline-title">{block.title}</h3> : null}
      <ol className="timeline-list">
        <motion.span
          className="timeline-rail"
          aria-hidden="true"
          initial={reduce ? false : { scaleY: 0 }}
          whileInView={{ scaleY: 1 }}
          viewport={{ once: true, amount: 0.05 }}
          transition={{ duration: Math.min(3, 0.35 * events.length), ease: "easeOut" }}
        />
        {events.map((e, i) => (
          <motion.li
            key={i}
            className={`timeline-item${e.highlight ? " hl" : ""}`}
            initial={reduce ? false : { opacity: 0, x: -10 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.7 }}
            transition={{ duration: 0.4 }}
          >
            <span className="timeline-dot" aria-hidden="true" />
            <span className="timeline-date">{e.date}</span>
            <span className="timeline-body">
              <strong>{e.title}</strong>
              {e.text ? <span>{e.text}</span> : null}
            </span>
          </motion.li>
        ))}
      </ol>
    </section>
  );
}

export function Sources({ block }: { block: SourcesBlock }) {
  const items = block.items.filter((i) => i.label);
  if (!items.length) return null;
  return (
    <section className="sources" aria-label="Sources">
      <h2>Sources</h2>
      <ol>
        {items.map((s, i) => (
          <li key={i}>{s.url ? <a href={s.url} target="_blank" rel="noopener noreferrer">{s.label}</a> : s.label}</li>
        ))}
      </ol>
    </section>
  );
}
