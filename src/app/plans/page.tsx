import type { Metadata } from "next";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";

export const metadata: Metadata = {
  title: "Plans",
  description: "ThinkInProducts plans: start free with the weekly newsletter and public articles, or upgrade for the full archive and every case study.",
  alternates: { canonical: "/plans" },
};

const PLANS = [
  { name: "Free", price: "₹0", items: ["The weekly newsletter", "Public articles and breakdowns", "The latest case study preview"], cta: "Subscribe free", href: "/subscribe", featured: false },
  { name: "Plus", price: "₹[price]", items: ["Everything in Free", "The full archive", "Every case study in full"], cta: "Choose Plus", href: "/login?plan=plus", featured: true },
  { name: "Pro", price: "₹[price]", items: ["Everything in Plus", "Every product breakdown", "PM templates and frameworks", "Community, when it opens"], cta: "Choose Pro", href: "/login?plan=pro", featured: false },
];

export default function PlansPage() {
  return (
    <>
      <SiteHeader />
      <main id="main" className="wrap" style={{ paddingTop: 56, paddingBottom: 96 }}>
        <h1 className="display" style={{ fontSize: "clamp(46px, 6vw, 80px)", marginBottom: 12 }}>Plans</h1>
        <p className="lead" style={{ margin: "0 0 44px" }}>Start free. Upgrade when you want the full archive and the deep dives.</p>
        <div className="plans-grid">
          {PLANS.map((p) => (
            <div key={p.name} className={`plan${p.featured ? " featured" : ""}`}>
              <h2>{p.name}</h2>
              <div className="plan-price">{p.price}{p.name !== "Free" ? <span> a month</span> : null}</div>
              <ul>{p.items.map((it) => <li key={it}>{it}</li>)}</ul>
              {p.featured ? <span className="hand red plan-note">the one I&apos;d pick</span> : null}
              <a href={p.href} className={`btn${p.featured ? " btn-dark" : ""}`} style={{ marginTop: "auto" }}>{p.cta}</a>
            </div>
          ))}
        </div>
        <p className="muted" style={{ fontSize: 15, marginTop: 14 }}>Paid plans open after launch.</p>
      </main>
      <SiteFooter />
    </>
  );
}
