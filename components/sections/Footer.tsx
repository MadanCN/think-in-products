"use client";

import Link from "next/link";
import { ArrowUp } from "lucide-react";
import { Separator } from "@/components/ui";
import NewsletterSection from "./NewsletterSection";

const links = {
  Learn: [
    { label: "Roadmap",     href: "/roadmap"   },
    { label: "Articles",    href: "/learn"     },
    { label: "Case Studies",href: "/portfolio" },
  ],
  About: [
    { label: "About",   href: "/about"                         },
    { label: "Contact", href: "mailto:hello@thinkinproducts.com" },
  ],
};

function BackToTop() {
  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      aria-label="Back to top"
      className="w-9 h-9 rounded-xl border border-border bg-bg-secondary flex items-center justify-center text-text-muted hover:text-accent-primary hover:border-accent-primary/30 transition-colors"
    >
      <ArrowUp className="w-4 h-4" />
    </button>
  );
}

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border mt-24">
      <div className="max-w-6xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">

          {/* Brand */}
          <div className="space-y-3">
            <p className="font-display font-bold text-text-primary">
              think in products<span className="text-accent-primary">.</span>
            </p>
            <p className="text-text-secondary text-sm leading-relaxed max-w-xs">
              A startup PM&rsquo;s learning journal — documented in public for
              anyone on the same journey.
            </p>
          </div>

          {/* Nav columns */}
          {Object.entries(links).map(([heading, items]) => (
            <div key={heading} className="space-y-3">
              <p className="font-mono text-xs text-text-muted uppercase tracking-widest">
                {heading}
              </p>
              <ul className="space-y-2">
                {items.map(({ label, href }) => (
                  <li key={href}>
                    <Link
                      href={href}
                      className="text-sm text-text-secondary hover:text-accent-primary transition-colors"
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* Compact newsletter */}
          <NewsletterSection variant="compact" source="footer" />
        </div>

        <Separator className="mb-6" />

        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="font-mono text-xs text-text-muted">
            Built by Madan &middot; Think In Products &middot; &copy; {year}
          </p>
          <div className="flex items-center gap-3">
            <p className="font-mono text-xs text-text-muted">Learning in public.</p>
            <BackToTop />
          </div>
        </div>
      </div>
    </footer>
  );
}
