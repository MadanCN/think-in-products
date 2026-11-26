import Link from "next/link";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";

export default function NotFound() {
  return (
    <>
      <SiteHeader />
      <main id="main" className="wrap" style={{ paddingTop: 48, paddingBottom: 120, maxWidth: 760 }}>
        <p className="hand red" style={{ fontSize: 26, margin: "0 0 8px" }}>this page got crossed out</p>
        <h1 className="display" style={{ fontSize: "clamp(48px, 6vw, 80px)", marginBottom: 16 }}>Nothing here.</h1>
        <p className="lead" style={{ marginBottom: 24 }}>The link may be old, or the piece was unpublished.</p>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <Link href="/articles" className="btn btn-dark">Browse articles</Link>
          <Link href="/search" className="btn">Search the site</Link>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
