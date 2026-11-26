import type { Metadata } from "next";
import Link from "next/link";
import "@/components/home/home.css";
import { Contents } from "@/components/home/Contents";
import { PieceCard } from "@/components/PieceCard";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";
import { SubscribeForm } from "@/components/SubscribeForm";
import { getPublished } from "@/lib/content";
import { JsonLd, SITE_DESCRIPTION, siteJsonLd } from "@/lib/seo";
import { SECTIONS, pieceUrl, type Piece } from "@/lib/types";

export const metadata: Metadata = {
  title: { absolute: "ThinkInProducts: Learn product management by making the call" },
  description: SITE_DESCRIPTION,
  alternates: { canonical: "/" },
};

export const revalidate = 300;

const WHAT_YOU_GET = [
  { type: "article" as const, when: "Every week", title: "An article", text: "One product management idea. You make the call first, then see how a PM would think it through." },
  { type: "breakdown" as const, when: "Every week", title: "A product breakdown", text: "A product, an app, a business model or a single screen taken apart. Every decision is marked up and answers one question: why?" },
  { type: "newsletter" as const, when: "Every week", title: "The newsletter", text: "What's happening in product, what I'm working on, and one tip you can use at work." },
  { type: "case_study" as const, when: "Every month", title: "A deep case study", text: "A deep dive into the product decisions that shaped a great product, explained in enough detail to really learn from." },
];

export default async function Home() {
  const all = await getPublished();
  const featured = all.filter((p) => p.featured && p.type !== "newsletter");
  const picks: Piece[] = [...featured, ...all.filter((p) => !p.featured && p.type !== "newsletter")].slice(0, 3);
  const start = all.find((p) => p.slug === "what-is-product-management") ?? all.find((p) => p.type === "article");
  const latestIssue = all.find((p) => p.type === "newsletter");

  return (
    <>
      <JsonLd data={siteJsonLd()} />
      <SiteHeader />

      {/* Hero: unchanged */}
      <section id="main" className="wrap" style={{ paddingTop: 72, paddingBottom: 96 }}>
        <div style={{ maxWidth: 860, margin: "0 auto", textAlign: "center" }}>
          <p className="hand red" style={{ margin: "0 0 20px", fontSize: 24 }}>a notebook for learning product management</p>
          <h1 className="display" style={{ fontSize: "clamp(42px, 5.2vw, 76px)", lineHeight: 1.04 }}>
            Every product is someone deciding <span className="sweep">what&apos;s worth building next.</span>
          </h1>
          <p className="lead" style={{ margin: "28px auto 0", maxWidth: 620, lineHeight: 1.65 }}>
            Behind every feature is a choice: what to build, for whom, and why now. That&apos;s product management.
          </p>
          <div style={{ margin: "40px auto 0", maxWidth: 560 }}>
            <SubscribeForm source="home-hero" />
          </div>
          <p style={{ margin: "14px 0 0", fontSize: 15, color: "var(--ink-3)" }}>
            One email a week. Or {start ? <Link href={pieceUrl(start)} style={{ fontWeight: 700 }}>try a free article first</Link> : "browse the articles"}.
          </p>
        </div>
      </section>

      {/* What you get */}
      <section className="wrap" style={{ paddingBottom: 96 }} aria-labelledby="get-h">
        <div className="section-head">
          <h2 id="get-h" className="h2">What you get from ThinkInProducts</h2>
          <span className="hand blue" style={{ fontSize: 24 }}>three every week, one every month</span>
        </div>
        <div className="get-grid">
          {WHAT_YOU_GET.map((g) => {
            const s = SECTIONS[g.type];
            return (
              <Link key={g.type} href={s.path} className="get-card">
                <span className="get-when" style={{ background: s.color }}>{g.when}</span>
                <span className="get-visual" aria-hidden="true">
                  {g.type === "article" ? (
                    <span className="mini-opts"><span>A. Build it now</span><span className="on">B. Ask why first</span></span>
                  ) : g.type === "breakdown" ? (
                    <span className="mini-markup">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src="/images/banana.png" alt="" width={40} height={40} />
                      <svg width="38" height="18" viewBox="0 0 40 20" fill="none" stroke="#C8102E" strokeWidth="3" strokeLinecap="round"><path d="M38 12 C28 6, 16 6, 4 10 M4 10 l10 -7 M4 10 l11 5" /></svg>
                      <span className="hand red">why a photo?</span>
                    </span>
                  ) : g.type === "newsletter" ? (
                    <span className="mini-mail"><b>This week in product</b><span>and one tip to try</span></span>
                  ) : (
                    <span className="mini-tl">
                      {["1998", "2007", "2011", "2023"].map((y, i) => <span key={y} className={i === 2 ? "on" : undefined}>{y}</span>)}
                    </span>
                  )}
                </span>
                <h3>{g.title}</h3>
                <p>{g.text}</p>
                <span className="get-link">{g.type === "newsletter" ? "Read the latest issue" : `Browse ${s.plural.toLowerCase()}`}</span>
              </Link>
            );
          })}
        </div>
        <p className="muted" style={{ margin: "16px 0 0", fontSize: 15 }}>Only the newsletter comes by email. Everything else lives here on the site, and each issue links to the week&apos;s new pieces.</p>
      </section>

      {/* Featured */}
      {picks.length ? (
        <section className="wrap" style={{ paddingBottom: 96 }} aria-labelledby="feat-h">
          <div className="section-head">
            <h2 id="feat-h" className="h2">Start here</h2>
            <Link href="/articles">See everything</Link>
          </div>
          <div className="featured-grid">
            {picks.map((p, i) => <PieceCard key={p.id} piece={p} size={i === 0 ? "large" : "normal"} />)}
          </div>
        </section>
      ) : null}

      {/* Latest issue */}
      {latestIssue ? (
        <section style={{ background: "var(--graphite)", color: "var(--on-dark)" }} aria-labelledby="issue-h">
          <div className="wrap issue-band">
            <div style={{ flex: "1 1 460px", minWidth: 0 }}>
              <p className="hand" style={{ margin: "0 0 8px", fontSize: 24, color: "var(--highlighter)" }}>the latest newsletter</p>
              <h2 id="issue-h" className="display" style={{ fontSize: "clamp(34px, 4vw, 54px)", lineHeight: 1.02 }}>{latestIssue.title}</h2>
              <p style={{ margin: "16px 0 24px", fontSize: 19, color: "var(--on-dark-2)", maxWidth: 560 }}>{latestIssue.subtitle}</p>
              <Link href={pieceUrl(latestIssue)} className="btn btn-yellow">Read this issue</Link>
            </div>
            <div style={{ flex: "1 1 360px", minWidth: 0, maxWidth: 480 }}>
              <p style={{ margin: "0 0 12px", fontWeight: 700, color: "var(--sheet)" }}>Get the next one in your inbox</p>
              <SubscribeForm source="home-issue" dark />
            </div>
          </div>
        </section>
      ) : null}

      {/* Contents */}
      <section id="contents" className="wrap" style={{ paddingTop: 96, paddingBottom: 72 }} aria-labelledby="contents-h">
        <div className="section-head">
          <h2 id="contents-h" className="h2">Contents</h2>
          <span className="hand blue" style={{ fontSize: 24 }}>open a tab to see what&apos;s inside</span>
        </div>
        <Contents />
      </section>

      {/* About */}
      <section className="wrap" style={{ paddingTop: 32, paddingBottom: 96 }}>
        <div className="about-strip">
          <figure className="about-photo">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/authors/madan.jpg" alt="Madan, who writes ThinkInProducts, leaning on a wall with arms crossed" width={500} height={625} loading="lazy" />
            <figcaption className="hand">hi, I&apos;m Madan</figcaption>
          </figure>
          <div style={{ flex: "999 1 420px", minWidth: 0 }}>
            <h2 className="h2" style={{ fontSize: "clamp(30px, 3.4vw, 44px)", marginBottom: 12 }}>Written by a PM, while still learning.</h2>
            <p className="lead" style={{ margin: "0 0 16px", maxWidth: 640 }}>
              I started as a developer and moved into product management in healthcare SaaS. ThinkInProducts is the notebook I wish I&apos;d had when I made that switch.
            </p>
            <div className="about-links">
              <Link href="/authors/madan" className="btn btn-sm btn-dark">More about me</Link>
              <Link href="/contact" className="btn btn-sm">Contact me</Link>
              <Link href="/write-for-us">Write for ThinkInProducts</Link>
            </div>
          </div>
        </div>
      </section>

      <SiteFooter />
    </>
  );
}
