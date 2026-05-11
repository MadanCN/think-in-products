import Link from "next/link";
import { Separator } from "@/components/ui";

const links = {
  Learn: [
    { label: "Roadmap", href: "/roadmap" },
    { label: "Articles", href: "/learn" },
    { label: "Case Studies", href: "/portfolio" },
  ],
  About: [
    { label: "Our Why", href: "/about" },
    { label: "Newsletter", href: "#newsletter" },
    { label: "Contact", href: "mailto:hello@thinkinproducts.com" },
  ],
};

export default function Footer() {
  return (
    <footer className="border-t border-border mt-24">
      <div className="max-w-6xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">
          {/* Brand */}
          <div className="space-y-3">
            <p className="font-display font-bold text-text-primary">
              think in products<span className="text-accent-primary">.</span>
            </p>
            <p className="text-text-secondary text-sm leading-relaxed max-w-xs">
              A structured learning hub for PMs who want to think more clearly about product work.
            </p>
          </div>

          {/* Nav columns */}
          {Object.entries(links).map(([heading, items]) => (
            <div key={heading} className="space-y-3">
              <p className="font-mono text-xs text-text-muted uppercase tracking-widest">{heading}</p>
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
        </div>

        <Separator className="mb-6" />

        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="font-mono text-xs text-text-muted">
            &copy; {new Date().getFullYear()} Think in Products. All rights reserved.
          </p>
          <p className="font-mono text-xs text-text-muted">
            Built for clarity.
          </p>
        </div>
      </div>
    </footer>
  );
}
