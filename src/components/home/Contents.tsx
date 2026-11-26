"use client";

import Link from "next/link";
import { useState } from "react";

type Row = { id: string; name: string; desc: string; swatch: string; panel: React.ReactNode };

const Arrow = ({ color }: { color: string }) => (
  <svg aria-hidden="true" width="44" height="20" viewBox="0 0 44 20" fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" style={{ flex: "0 0 44px" }}>
    <path d="M42 12 C30 6, 16 6, 4 10 M4 10 l10 -7 M4 10 l11 5" />
  </svg>
);

const ROWS: Row[] = [
  {
    id: "article",
    name: "Articles",
    desc: "Weekly. One PM idea, starting with a call you make yourself.",
    swatch: "var(--highlighter)",
    panel: (
      <div style={{ display: "flex", flexWrap: "wrap", gap: 16 }}>
        <div className="mini-step" style={{ background: "var(--graphite)", color: "var(--on-dark)" }}><b style={{ color: "var(--highlighter)" }}>1. Make the call</b><span>Pick A, B or C before you read any explanation.</span></div>
        <div className="mini-step" style={{ background: "var(--sheet)" }}><b className="red">2. See it</b><span>A chart, sketch or marked-up screen shows the idea.</span></div>
        <div className="mini-step" style={{ background: "var(--sheet)" }}><b className="blue">3. Understand it</b><span>Plain words, trade-offs left in, notes in the margin.</span></div>
        <div className="mini-step" style={{ background: "var(--highlighter)" }}><b>4. Check yourself</b><span>Feedback on your answers and what to read next.</span></div>
        <Link href="/articles" style={{ flexBasis: "100%", fontWeight: 700 }}>Browse articles</Link>
      </div>
    ),
  },
  {
    id: "breakdown",
    name: "Breakdowns",
    desc: "Weekly. A product, app, business model or screen taken apart, every decision asked why.",
    swatch: "var(--tab-pink)",
    panel: (
      <div style={{ display: "flex", flexDirection: "column", gap: 14, maxWidth: 760 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <div style={{ flex: "0 0 260px", border: "2px dashed var(--red)", borderRadius: 12, padding: "10px 12px", background: "var(--white)" }}>
            <div style={{ fontSize: 14, fontWeight: 600 }}>Other sellers on this store (12) from ₹499</div>
          </div>
          <Arrow color="#c8102e" />
          <p className="hand red" style={{ margin: 0, fontSize: 20 }}>Competitors on the same page: selection without buying stock.</p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <div style={{ flex: "0 0 260px", display: "flex", gap: 8 }}>
            {["egg", "cheese_wedge", "avocado"].map((n) => (
              <div key={n} style={{ flex: 1, height: 64, background: "#EEF3EA", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`/images/${n}.png`} alt="" width={40} height={40} />
              </div>
            ))}
          </div>
          <Arrow color="#1f3fbf" />
          <p className="hand blue" style={{ margin: 0, fontSize: 20 }}>More buyers, more reviews, more trust. The loop turns.</p>
        </div>
        <Link href="/breakdowns" style={{ fontWeight: 700 }}>Browse product breakdowns</Link>
      </div>
    ),
  },
  {
    id: "case_study",
    name: "Case studies",
    desc: "Monthly. A deep dive into the decisions that shaped a great product.",
    swatch: "var(--tab-blue)",
    panel: (
      <div style={{ maxWidth: 820 }}>
        <p style={{ margin: "0 0 16px", fontSize: 22, fontWeight: 800, fontStretch: "80%" }}>Netflix: from DVD rentals to streaming</p>
        <div style={{ display: "flex", flexWrap: "wrap" }}>
          {[
            ["1998", "Red envelopes: DVDs by post, no late fees."],
            ["2007", "Streaming launches as a free extra with 1,000 titles."],
            ["2011", "A 60% price rise and Qwikster cost 800,000 subscribers."],
            ["2023", "The last DVD ships. Streaming has won."],
          ].map(([h, t], i) => (
            <div key={h} style={{ flex: "1 1 170px", padding: "0 14px 14px 0", borderTop: `3px solid ${i === 2 ? "var(--red)" : "var(--graphite)"}` }}>
              <div style={{ fontWeight: 700, marginTop: 10, color: i === 2 ? "var(--red)" : undefined }}>{h}</div>
              <div style={{ fontSize: 15, color: "var(--ink-2)" }}>{t}</div>
            </div>
          ))}
        </div>
        <Link href="/case-studies" style={{ fontWeight: 700 }}>Browse case studies</Link>
      </div>
    ),
  },
  {
    id: "newsletter",
    name: "Newsletter",
    desc: "Weekly. What's happening in product and what I'm working on.",
    swatch: "var(--sheet)",
    panel: (
      <div style={{ display: "flex", flexWrap: "wrap", gap: 24, alignItems: "flex-start" }}>
        <div style={{ flex: "0 1 380px", minWidth: 0, background: "var(--white)", border: "2px solid var(--graphite)", borderRadius: 12, overflow: "hidden" }}>
          <div style={{ padding: "10px 16px", borderBottom: "1.5px solid var(--grid)", fontSize: 13, color: "var(--ink-3)" }}>From: ThinkInProducts, every week</div>
          <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 10 }}>
            {["This week in product", "What I'm working on", "One thing to try"].map((h, i) => (
              <div key={h}>
                <div style={{ fontSize: 14, fontWeight: 700 }}>{h}</div>
                <div style={{ height: 8, width: `${90 - i * 15}%`, background: i === 2 ? "var(--highlighter)" : "#E3E8DE", borderRadius: 4, marginTop: 6 }} />
              </div>
            ))}
          </div>
        </div>
        <div style={{ flex: "1 1 260px" }}>
          <p className="hand blue" style={{ margin: "0 0 12px", fontSize: 22 }}>Every issue is also a page on the site, so nothing gets lost in your inbox.</p>
          <Link href="/newsletter" style={{ fontWeight: 700 }}>Read the latest issue</Link>
        </div>
      </div>
    ),
  },
];

export function Contents() {
  const [open, setOpen] = useState("article");
  return (
    <div style={{ borderTop: "2px solid var(--graphite)" }}>
      {ROWS.map((r) => {
        const isOpen = open === r.id;
        return (
          <div key={r.id} className={`toc-row${isOpen ? " open" : ""}`}>
            <button
              type="button"
              className="toc-btn"
              aria-expanded={isOpen}
              aria-controls={`toc-${r.id}`}
              onClick={() => setOpen(isOpen ? "" : r.id)}
            >
              <span aria-hidden="true" className="toc-swatch" style={{ background: r.swatch }} />
              <span className="toc-name">{r.name}</span>
              <span className="toc-desc">{r.desc}</span>
              <span aria-hidden="true" className="toc-sign">{isOpen ? "–" : "+"}</span>
            </button>
            {isOpen ? <div id={`toc-${r.id}`} className="toc-panel">{r.panel}</div> : null}
          </div>
        );
      })}
    </div>
  );
}
