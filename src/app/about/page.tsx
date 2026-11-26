import type { Metadata } from "next";
import Link from "next/link";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";
import { SubscribeForm } from "@/components/SubscribeForm";

export const metadata: Metadata = {
  title: "About",
  description: "About ThinkInProducts: a product management notebook written by a developer turned product manager in healthcare SaaS.",
  alternates: { canonical: "/about" },
};

export default function About() {
  return (
    <>
      <SiteHeader />
      <main id="main" className="wrap" style={{ paddingTop: 56, paddingBottom: 96, maxWidth: 760 }}>
        <p className="hand red" style={{ fontSize: 24, margin: "0 0 10px" }}>about this notebook</p>
        <h1 className="display" style={{ fontSize: "clamp(44px, 5.6vw, 76px)", marginBottom: 24 }}>Learn product by making the call first.</h1>
        <figure className="about-page-photo">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/authors/madan.jpg" alt="Madan, who writes ThinkInProducts" width={500} height={625} />
          <figcaption className="hand">Madan, writing this notebook</figcaption>
        </figure>
        <div className="prose">
          <p>ThinkInProducts is written by <Link href="/authors/madan">Madan</Link>, a product manager in healthcare SaaS who started out as a developer. The hardest part of moving into product wasn&apos;t learning frameworks. It was learning to ask &ldquo;why&rdquo; before &ldquo;how&rdquo;, and to explain decisions so others could follow them.</p>
          <p>So every piece here starts with a real decision for you to make. Then it shows the thinking: a picture, a chart or a marked-up screen, a plain explanation, and a check at the end. Along the way you&apos;ll find <strong>TiPs</strong>, short Think in Products tips you can use at work the same week.</p>
          <h2>What gets published</h2>
          <ul>
            <li><Link href="/articles">Articles</Link>: one product management idea a week.</li>
            <li><Link href="/breakdowns">Product breakdowns</Link>: a product or business model taken apart, weekly.</li>
            <li><Link href="/case-studies">Case studies</Link>: one deep story a month.</li>
            <li><Link href="/newsletter">The newsletter</Link>: weekly, and the only thing sent by email.</li>
          </ul>
          <p>Facts in every piece come with sources at the end. Images are credited where they appear.</p>
          <h2>Get in touch</h2>
          <p>Questions, corrections or ideas? <Link href="/contact">Send me a message</Link>. Want to publish your own piece here? <Link href="/write-for-us">Pitch it</Link>.</p>
        </div>
        <div className="taped" style={{ marginTop: 40, padding: 28 }}>
          <p style={{ margin: "0 0 12px", fontWeight: 700 }}>Get the weekly newsletter</p>
          <SubscribeForm source="about" />
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
