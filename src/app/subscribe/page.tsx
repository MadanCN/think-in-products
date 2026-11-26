import type { Metadata } from "next";
import Link from "next/link";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";
import { SubscribeForm } from "@/components/SubscribeForm";

export const metadata: Metadata = {
  title: "Subscribe to the newsletter",
  description: "Get the ThinkInProducts newsletter: one email a week with what's happening in product, a practical tip, and links to new articles, breakdowns and case studies.",
  alternates: { canonical: "/subscribe" },
};

const GETS = [
  ["One email a week", "What's happening in product, and what I'm building and learning."],
  ["A TiP you can use", "One practical Think in Products tip to try at work that week."],
  ["Links to what's new", "The week's article and product breakdown, and the monthly case study."],
];

export default function SubscribePage() {
  return (
    <>
      <SiteHeader />
      <main id="main" className="wrap" style={{ paddingTop: 64, paddingBottom: 96 }}>
        <div className="subscribe-card">
          <p className="hand red" style={{ margin: "0 0 10px", fontSize: 24 }}>free, weekly, no spam</p>
          <h1 className="display" style={{ fontSize: "clamp(44px, 5.6vw, 76px)", lineHeight: 0.98 }}>Get better at product, one email a week.</h1>
          <ul className="subscribe-gets">
            {GETS.map(([h, t]) => (
              <li key={h}>
                <svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#C8102E" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12.5l5 5L20 6" /></svg>
                <span><strong>{h}.</strong> {t}</span>
              </li>
            ))}
          </ul>
          <SubscribeForm source="subscribe-page" cta="Subscribe free" />
          <p style={{ margin: "14px 0 0", fontSize: 15, color: "var(--ink-3)" }}>
            You&apos;ll get a confirmation email first. Unsubscribe from any email in one click. <Link href="/newsletter">Read the latest issue</Link>.
          </p>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
