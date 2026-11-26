import type { Metadata } from "next";
import Link from "next/link";
import { InboxForm } from "@/components/InboxForm";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";
import { formToken, turnstileSiteKey } from "@/lib/security/antispam";

export const metadata: Metadata = {
  title: "Contact",
  description: "Send a question, a correction or an idea to Madan, who writes ThinkInProducts.",
  alternates: { canonical: "/contact" },
};
export const dynamic = "force-dynamic";

export default async function Contact() {
  return (
    <>
      <SiteHeader />
      <main id="main" className="wrap form-page">
        <div className="form-intro">
          <p className="hand red" style={{ fontSize: 24, margin: "0 0 8px" }}>say hello</p>
          <h1 className="display">Contact me</h1>
          <p className="lead">Questions, corrections, ideas for a breakdown, or just a hello. I read every message and reply by email.</p>
          <p className="muted" style={{ fontSize: 15 }}>Want to publish your own piece? <Link href="/write-for-us">Pitch it here</Link> instead.</p>
        </div>
        <div className="form-card">
          <InboxForm kind="contact" token={await formToken("contact")} turnstileKey={turnstileSiteKey} />
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
