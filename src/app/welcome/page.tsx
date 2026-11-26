import Link from "next/link";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";

export const metadata = { title: "Welcome" };

export default function Welcome() {
  return (
    <>
      <SiteHeader />
      <main id="main" className="wrap" style={{ paddingTop: 48, paddingBottom: 120, maxWidth: 820 }}>
        <p className="hand red" style={{ fontSize: 26, margin: "0 0 10px" }}>you&apos;re in</p>
        <h1 className="display" style={{ fontSize: "clamp(48px, 6vw, 80px)", marginBottom: 18 }}>Welcome to the notebook.</h1>
        <p className="lead" style={{ margin: "0 0 28px" }}>Your first issue arrives this week. While you wait, start with the piece most people read first.</p>
        <Link className="btn btn-dark" href="/articles/what-is-product-management">Read: What is product management?</Link>
      </main>
      <SiteFooter />
    </>
  );
}
