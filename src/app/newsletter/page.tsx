import type { Metadata } from "next";
import { PieceView } from "@/components/blocks/PieceView";
import { PieceCard } from "@/components/PieceCard";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";
import { SubscribeForm } from "@/components/SubscribeForm";
import { getPublished } from "@/lib/content";
import { getAuthor } from "@/lib/repo";
import { ogImageFor } from "@/lib/seo";
import { SECTIONS } from "@/lib/types";

const s = SECTIONS.newsletter;

export const metadata: Metadata = {
  title: "Newsletter",
  description: "The ThinkInProducts newsletter: what's happening in product, what I'm working on, and one practical tip, every week. Read the latest issue and the archive.",
  alternates: { canonical: "/newsletter" },
  openGraph: { title: "The ThinkInProducts newsletter", url: "/newsletter", images: [ogImageFor("The weekly newsletter", "ThinkInProducts")] },
};

export const revalidate = 300;

export default async function NewsletterPage() {
  const issues = await getPublished("newsletter");
  const [latest, ...past] = issues;
  const author = latest ? await getAuthor(latest.author) : null;
  return (
    <>
      <SiteHeader active="newsletter" />
      <main id="main">
        <section className="wrap index-hero" style={{ paddingBottom: 8 }}>
          <div style={{ flex: "1 1 520px", minWidth: 0 }}>
            <span className="tag" style={{ background: s.color }}>Newsletter</span>
            <h1 className="display" style={{ fontSize: "clamp(46px, 6vw, 84px)", margin: "16px 0 14px" }}>The weekly newsletter</h1>
            <p className="lead" style={{ margin: 0, maxWidth: 620 }}>{s.blurb} The only thing ThinkInProducts sends by email.</p>
          </div>
          <div className="index-search" style={{ background: "var(--highlighter)", border: "2px solid var(--graphite)", boxShadow: "8px 8px 0 var(--graphite)", padding: 20 }}>
            <p style={{ margin: "0 0 10px", fontWeight: 700 }}>Get the next issue</p>
            <SubscribeForm source="newsletter-page" cta="Subscribe" />
          </div>
        </section>

        {latest ? (
          <>
            <p className="wrap hand red" style={{ fontSize: 24, margin: "40px auto 0", textAlign: "center" }}>the latest issue</p>
            <PieceView piece={latest} author={author} breadcrumbs={false} />
          </>
        ) : (
          <p className="wrap" style={{ padding: "48px 2rem" }}>The first issue is on its way. Subscribe above to get it.</p>
        )}

        {past.length ? (
          <section className="wrap" style={{ paddingBottom: 80 }} aria-labelledby="past-h">
            <h2 id="past-h" className="h2" style={{ fontSize: 32, marginBottom: 12 }}>Past issues</h2>
            <div style={{ borderTop: "2px solid var(--graphite)" }}>{past.map((p) => <PieceCard key={p.id} piece={p} size="row" />)}</div>
          </section>
        ) : null}
      </main>
      <SiteFooter />
    </>
  );
}
