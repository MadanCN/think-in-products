"use client";

import { animate, motion, useInView, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import type { CauseArrowsBlock, ChartBlock, CycleBlock, VennBlock } from "@/lib/types";

/* Chart: bars grow in when scrolled into view; the biggest one is highlighted. */
export function Chart({ block }: { block: ChartBlock }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.4 });
  const reduce = useReducedMotion();
  const rows = block.rows.filter((r) => r.label);
  const max = Math.max(1, ...rows.map((r) => Number(r.value) || 0));
  return (
    <figure className="chart" ref={ref} style={{ margin: 0 }}>
      {block.title ? <h3>{block.title}</h3> : null}
      {rows.map((r, i) => {
        const v = Number(r.value) || 0;
        return (
          <div className="chart-row" key={i}>
            <span className="chart-label">{r.label}</span>
            <div className="chart-track">
              <motion.div
                className={`chart-bar${v === max ? " top" : ""}`}
                style={{ width: `${(v / max) * 100}%` }}
                initial={reduce ? false : { scaleX: 0 }}
                animate={reduce || inView ? { scaleX: 1 } : { scaleX: 0 }}
                transition={{ delay: i * 0.15, duration: 0.7, ease: [0.3, 0.7, 0.2, 1] }}
                aria-label={`${r.label}: ${v}${block.unit ? ` ${block.unit}` : ""}`}
              >
                {v.toLocaleString("en-IN")}
              </motion.div>
            </div>
          </div>
        );
      })}
      {block.note ? (
        <figcaption className="chart-note">
          {block.note}
          {block.sourceUrl ? <> <a href={block.sourceUrl} target="_blank" rel="noopener noreferrer">View source</a></> : null}
        </figcaption>
      ) : null}
    </figure>
  );
}

/* Cause arrows: lines reach out from the problem to each reason, one at a time. */
export function CauseArrows({ block }: { block: CauseArrowsBlock }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.4 });
  const reduce = useReducedMotion();
  const [w, setW] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setW(el.clientWidth));
    ro.observe(el);
    setW(el.clientWidth);
    return () => ro.disconnect();
  }, []);
  const reasons = block.reasons.filter(Boolean);
  const n = Math.max(1, reasons.length);
  const show = reduce || inView;
  const H = 90;
  const GAP = 14;
  const colW = (w - GAP * (n - 1)) / n;
  return (
    <div className="causes" ref={ref} id={block.id}>
      <div className="cause-problem">{block.problem || "The problem"}</div>
      {w > 0 ? (
        <svg className="cause-lines" viewBox={`0 0 ${w} ${H}`} style={{ height: H }} aria-hidden="true">
          {reasons.map((_, i) => {
            const x = i * (colW + GAP) + colW / 2;
            const ey = H - 4;
            return (
              <motion.path
                key={i}
                d={`M ${w / 2} 0 C ${w / 2} ${H * 0.55}, ${x} ${H * 0.35}, ${x} ${ey} M ${x - 7} ${ey - 9} L ${x} ${ey} L ${x + 7} ${ey - 9}`}
                fill="none"
                stroke="#c8102e"
                strokeWidth={3}
                strokeLinecap="round"
                strokeLinejoin="round"
                initial={reduce ? false : { pathLength: 0, opacity: 0 }}
                animate={show ? { pathLength: 1, opacity: 1 } : { pathLength: 0, opacity: 0 }}
                transition={{ delay: 0.3 + i * 0.5, duration: 0.7, ease: "easeInOut" }}
              />
            );
          })}
        </svg>
      ) : (
        <div style={{ height: H }} />
      )}
      <div className="cause-reasons" style={{ gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))` }}>
        {reasons.map((r, i) => (
          <motion.div
            key={i}
            className="cause-reason"
            initial={reduce ? false : { opacity: 0, y: 8 }}
            animate={show ? { opacity: 1, y: 0 } : { opacity: 0, y: 8 }}
            transition={{ delay: 0.85 + i * 0.5, duration: 0.35 }}
          >
            {r}
          </motion.div>
        ))}
      </div>
    </div>
  );
}

/* Venn: hover or tap a circle to highlight it and read what lives there. */
const VENN_COLORS = ["#ffe95c", "#a9c8f0", "#f4a3a8"];
export function Venn({ block }: { block: VennBlock }) {
  const circles = block.circles.filter((c) => c.label).slice(0, 3);
  const [active, setActive] = useState<number | null>(null);
  const three = circles.length === 3;
  const pos = three
    ? [{ x: 145, y: 120 }, { x: 255, y: 120 }, { x: 200, y: 210 }]
    : [{ x: 155, y: 150 }, { x: 245, y: 150 }];
  const detail = active === null ? block.overlap || "Hover or tap a circle." : circles[active]?.detail;
  return (
    <div className="venn">
      <svg viewBox="0 0 400 320" role="img" aria-label={`${block.title || "Venn diagram"}: ${circles.map((c) => c.label).join(", ")}`}>
        {circles.map((c, i) => (
          <circle
            key={i}
            cx={pos[i].x}
            cy={pos[i].y}
            r={95}
            fill={VENN_COLORS[i]}
            fillOpacity={active === null ? 0.55 : active === i ? 0.95 : 0.18}
            stroke="#22262b"
            strokeWidth={active === i ? 4 : 2}
            onMouseEnter={() => setActive(i)}
            onMouseLeave={() => setActive(null)}
            onClick={() => setActive(active === i ? null : i)}
          />
        ))}
        {circles.map((c, i) => {
          const lx = three ? [118, 282, 200][i] : [110, 290][i];
          const ly = three ? [100, 100, 280][i] : [150, 150][i];
          return (
            <text key={i} x={lx} y={ly} textAnchor="middle" fontSize="19" fontWeight="800" fill="#22262b" style={{ pointerEvents: "none" }}>
              {c.label}
            </text>
          );
        })}
        <text x={200} y={three ? 158 : 156} textAnchor="middle" fontSize="15" fontWeight="800" fill="#c8102e" style={{ pointerEvents: "none" }}>
          PM
        </text>
      </svg>
      <div className="venn-text">
        {block.title ? <h3>{block.title}</h3> : null}
        <p className="venn-detail" aria-live="polite">{detail}</p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {circles.map((c, i) => (
            <button
              key={i}
              type="button"
              className="tag"
              style={{ background: active === i ? VENN_COLORS[i] : "var(--white)", cursor: "pointer", minHeight: 36, font: "inherit", fontSize: 14, fontWeight: 700 }}
              aria-pressed={active === i}
              onClick={() => setActive(active === i ? null : i)}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* Cycle / flywheel: steps on a loop, with a marker going round and round. */
export function Cycle({ block }: { block: CycleBlock }) {
  const steps = block.steps.filter(Boolean);
  const reduce = useReducedMotion();
  const ref = useRef<SVGSVGElement>(null);
  const inView = useInView(ref, { amount: 0.3 });
  const [angle, setAngle] = useState(-90);
  useEffect(() => {
    if (reduce || !inView) return;
    const controls = animate(-90, 270, { duration: 8, repeat: Infinity, ease: "linear", onUpdate: setAngle });
    return () => controls.stop();
  }, [reduce, inView]);
  const n = Math.max(1, steps.length);
  const CX = 230, CY = 170, RX = 140, RY = 118;
  const rad = (a: number) => (a * Math.PI) / 180;
  const activeIdx = Math.floor(((((angle + 90) % 360) + 360) % 360) / (360 / n));
  return (
    <div className="cycle">
      <svg ref={ref} viewBox="0 0 460 340" role="img" aria-label={`Cycle: ${steps.join(", then ")}, and back to ${steps[0] ?? "the start"}`}>
        <ellipse cx={CX} cy={CY} rx={RX} ry={RY} fill="none" stroke="#22262b" strokeWidth={2} strokeDasharray="6 7" />
        {!reduce ? <circle cx={CX + RX * Math.cos(rad(angle))} cy={CY + RY * Math.sin(rad(angle))} r={9} fill="#c8102e" /> : null}
        {steps.map((s, i) => {
          const a = -90 + (360 / n) * i;
          const x = CX + RX * Math.cos(rad(a));
          const y = CY + RY * Math.sin(rad(a));
          const w = Math.min(176, Math.max(104, s.length * 8.4 + 26));
          const on = !reduce && i === activeIdx;
          return (
            <g key={i}>
              <rect x={x - w / 2} y={y - 21} width={w} height={42} rx={12} fill={on ? "#ffe95c" : "#f7faf4"} stroke="#22262b" strokeWidth={2} />
              <text x={x} y={y + 5} textAnchor="middle" fontSize="15" fontWeight="700" fill="#22262b">{s}</text>
            </g>
          );
        })}
      </svg>
      {block.title ? <h3>{block.title}</h3> : null}
    </div>
  );
}
