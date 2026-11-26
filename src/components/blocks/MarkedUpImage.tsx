"use client";

import { motion, useInView, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import type { MarkedUpImageBlock } from "@/lib/types";
import { CreditLine } from "./Extras";

const PEN = { red: "#c8102e", blue: "#1f3fbf" } as const;

type Geo = { w: number; h: number; imgX: number; imgY: number; imgW: number; imgH: number; colW: number };

// A screenshot with handwritten notes; arrows draw in, one by one, to the exact point.
// Authors place each note by clicking on the image in the admin (x, y in %).
export function MarkedUpImage({ block }: { block: MarkedUpImageBlock }) {
  const stageRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const [geo, setGeo] = useState<Geo | null>(null);
  const [compact, setCompact] = useState(false);
  const inView = useInView(stageRef, { once: true, amount: 0.3 });
  const reduce = useReducedMotion();

  useEffect(() => {
    const stage = stageRef.current;
    const img = imgRef.current;
    if (!stage || !img) return;
    const measure = () => {
      const s = stage.getBoundingClientRect();
      const i = img.getBoundingClientRect();
      setCompact(s.width < 720);
      setGeo({ w: s.width, h: s.height, imgX: i.left - s.left, imgY: i.top - s.top, imgW: i.width, imgH: i.height, colW: s.width / 3.15 });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(stage);
    img.addEventListener("load", measure);
    return () => {
      ro.disconnect();
      img.removeEventListener("load", measure);
    };
  }, [block.src]);

  const notes = block.notes ?? [];
  const show = reduce || inView;

  return (
    <figure className={`markup figure${compact ? " compact" : ""}`} style={{ margin: 0 }}>
      <div className="markup-stage" ref={stageRef}>
        <div className="markup-img">
          {block.src ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img ref={imgRef} src={block.src} alt={block.alt} />
          ) : (
            <div ref={imgRef as unknown as React.RefObject<HTMLDivElement>} style={{ aspectRatio: "9 / 16", border: "2px dashed var(--ink-4)", borderRadius: 28, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--ink-3)" }}>
              Add a screenshot
            </div>
          )}
          {notes.map((n, i) => (
            <span key={n.id} className="markup-dot" style={{ left: `${n.x}%`, top: `${n.y}%`, background: PEN[n.pen] }} aria-hidden="true">
              {i + 1}
            </span>
          ))}
        </div>

        {geo && !compact
          ? notes.map((n, i) => {
              const py = geo.imgY + (n.y / 100) * geo.imgH;
              return (
                <motion.p
                  key={n.id}
                  className={`markup-note ${n.side} ${n.pen}`}
                  style={{ top: py, width: geo.colW - 36, margin: 0 }}
                  initial={reduce ? false : { opacity: 0 }}
                  animate={show ? { opacity: 1 } : { opacity: 0 }}
                  transition={{ delay: 0.3 + i * 0.7 + 0.45, duration: 0.4 }}
                >
                  {n.text}
                </motion.p>
              );
            })
          : null}

        {geo && !compact ? (
          <svg className="arrows" aria-hidden="true" viewBox={`0 0 ${geo.w} ${geo.h}`}>
            {notes.map((n, i) => {
              const px = geo.imgX + (n.x / 100) * geo.imgW;
              const py = geo.imgY + (n.y / 100) * geo.imgH;
              const sx = n.side === "left" ? geo.colW - 28 : geo.w - geo.colW + 28;
              const sy = py - 6;
              const ex = n.side === "left" ? px - 8 : px + 8;
              const ey = py;
              const cx = (sx + ex) / 2;
              const cy = Math.min(sy, ey) - 26;
              const ang = Math.atan2(ey - cy, ex - cx);
              const head = (a: number) => `${ex} ${ey} L ${ex - 14 * Math.cos(ang + a)} ${ey - 14 * Math.sin(ang + a)}`;
              const d = `M ${sx} ${sy} Q ${cx} ${cy} ${ex} ${ey} M ${head(0.45)} M ${head(-0.45)}`;
              return (
                <motion.path
                  key={n.id}
                  d={d}
                  fill="none"
                  stroke={PEN[n.pen]}
                  strokeWidth={3}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  initial={reduce ? false : { pathLength: 0, opacity: 0 }}
                  animate={show ? { pathLength: 1, opacity: 1 } : { pathLength: 0, opacity: 0 }}
                  transition={{ delay: 0.3 + i * 0.7, duration: 0.6, ease: "easeOut" }}
                />
              );
            })}
          </svg>
        ) : null}
      </div>

      <ol className="markup-list">
        {notes.map((n, i) => (
          <li key={n.id} style={{ color: PEN[n.pen] }}>
            <span className="num" style={{ background: PEN[n.pen] }}>{i + 1}</span>
            <span>{n.text}</span>
          </li>
        ))}
      </ol>
      {block.caption || block.credit ? (
        <figcaption>
          {block.caption}
          {block.creditUrl ? <CreditLine credit={block.credit} creditUrl={block.creditUrl} /> : null}
        </figcaption>
      ) : null}
    </figure>
  );
}
