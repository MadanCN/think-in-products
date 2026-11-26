import Link from "next/link";
import { Logo } from "./Logo";
import { SubscribeForm } from "./SubscribeForm";
import { AccountMenu, MobileAccountLinks } from "./account/AccountMenu";

type NavKey = "article" | "case_study" | "breakdown" | "newsletter" | "login" | undefined;

const NAV: { key: NavKey; href: string; label: string }[] = [
  { key: "article", href: "/articles", label: "Articles" },
  { key: "case_study", href: "/case-studies", label: "Case studies" },
  { key: "breakdown", href: "/breakdowns", label: "Breakdowns" },
  { key: "newsletter", href: "/newsletter", label: "Newsletter" },
];

export function SiteHeader({ active }: { active?: NavKey }) {
  return (
    <header className="site-header">
      <div className="wrap site-header-inner">
        <Logo height={30} />
        <nav className="site-nav" aria-label="Main">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className={active === n.key ? "active" : undefined} aria-current={active === n.key ? "page" : undefined}>
              {n.label}
            </Link>
          ))}
          <Link href="/search" aria-label="Search" className="nav-icon">
            <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><circle cx="10.5" cy="10.5" r="6.5" /><path d="M20 20l-4.6-4.6" /></svg>
          </Link>
          <Link href="/subscribe" className="btn btn-dark btn-sm when-unsub">Subscribe</Link>
          <AccountMenu active={active === "login"} />
        </nav>
        <details className="mobile-nav">
          <summary aria-label="Menu">
            <svg aria-hidden="true" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M4 7h16M4 12h16M4 17h16" /></svg>
          </summary>
          <div className="mobile-panel">
            {NAV.map((n) => <Link key={n.href} href={n.href}>{n.label}</Link>)}
            <Link href="/search">Search</Link>
            <MobileAccountLinks />
            <Link href="/subscribe" className="btn btn-red when-unsub">Subscribe free</Link>
          </div>
        </details>
      </div>
    </header>
  );
}

export function SiteFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="site-footer">
      <div className="wrap">
        <div className="footer-top">
          <div className="footer-brand">
            <Logo height={34} tone="light" />
            <p>A notebook for learning product management. Make the call first, then see how a PM would think it through.</p>
          </div>
          <div className="footer-sub when-unsub">
            <p className="hand" style={{ margin: "0 0 10px", fontSize: 22, color: "var(--highlighter)" }}>one email a week, every Sunday-ish</p>
            <SubscribeForm source="footer" cta="Subscribe" dark />
          </div>
        </div>
        <div className="footer-cols">
          <nav aria-label="Read">
            <h2>Read</h2>
            <Link href="/articles">Articles</Link>
            <Link href="/case-studies">Case studies</Link>
            <Link href="/breakdowns">Product breakdowns</Link>
            <Link href="/newsletter">Newsletter archive</Link>
          </nav>
          <nav aria-label="Start here">
            <h2>Start here</h2>
            <Link href="/articles/what-is-product-management">What is product management?</Link>
            <Link href="/case-studies/netflix-dvd-to-streaming">Netflix: DVDs to streaming</Link>
            <Link href="/breakdowns/amazon-flywheel">Amazon: the flywheel</Link>
          </nav>
          <nav aria-label="Account">
            <h2>Account</h2>
            <Link href="/subscribe" className="when-unsub">Subscribe</Link>
            <Link href="/plans">Plans</Link>
            <Link href="/account">Your profile</Link>
          </nav>
          <nav aria-label="About">
            <h2>About</h2>
            <Link href="/about">About ThinkInProducts</Link>
            <Link href="/contact">Contact</Link>
            <Link href="/write-for-us">Write for us</Link>
            <Link href="/privacy">Privacy</Link>
            <a href="/rss.xml">RSS feed</a>
            <a href="/sitemap.xml">Sitemap</a>
          </nav>
        </div>
        <div className="footer-bottom">
          <span>© {year} ThinkInProducts</span>
        </div>
      </div>
    </footer>
  );
}
