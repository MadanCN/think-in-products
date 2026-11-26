import type { Metadata } from "next";
import { InboxForm } from "@/components/InboxForm";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";
import { formToken, turnstileSiteKey } from "@/lib/security/antispam";

export const metadata: Metadata = {
  title: "Write for ThinkInProducts",
  description: "Pitch an article, case study or product breakdown for ThinkInProducts. Tell us your idea; if it's a fit, we'll plan the piece together.",
  alternates: { canonical: "/write-for-us" },
};
export const dynamic = "force-dynamic";

export default async function WriteForUs() {
  return (
    <>
      <SiteHeader />
      <main id="main" className="wrap form-page">
        <div className="form-intro">
          <p className="hand red" style={{ fontSize: 24, margin: "0 0 8px" }}>your piece, here</p>
          <h1 className="display">Publish your piece in ThinkInProducts</h1>
          <p className="lead">Have a product decision you&apos;ve made, a product you love taking apart, or a case you know inside out? Pitch it.</p>
          <ul className="form-points">
            <li>Pitch an article, a case study or a product breakdown.</li>
            <li>If it&apos;s a fit, we plan it together and I help edit it into the notebook style.</li>
            <li>Published pieces carry your name and link to your author page.</li>
          </ul>
        </div>
        <div className="form-card">
          <InboxForm kind="pitch" token={await formToken("pitch")} turnstileKey={turnstileSiteKey} />
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
