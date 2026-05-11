"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { label: "Roadmap",   href: "/roadmap"   },
  { label: "Learn",     href: "/learn"     },
  { label: "Portfolio", href: "/portfolio" },
  { label: "About",     href: "/about"     },
];

export default function Navbar() {
  const [scrolled,    setScrolled]    = useState(false);
  const [mobileOpen,  setMobileOpen]  = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close drawer on route change
  useEffect(() => { setMobileOpen(false); }, [pathname]);

  return (
    <>
      <header
        className={cn(
          "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
          scrolled
            ? "bg-bg-primary/75 backdrop-blur-xl border-b border-border/60"
            : "bg-transparent"
        )}
      >
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">

          {/* Logo */}
          <Link
            href="/"
            className="font-display text-lg font-bold tracking-tight select-none"
            aria-label="Think In Products — home"
          >
            <span className="text-accent-primary">Think In</span>
            <span className="text-text-primary"> Products</span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1" aria-label="Main navigation">
            {NAV_LINKS.map(({ label, href }) => {
              const active = pathname === href || pathname.startsWith(href + "/");
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "relative px-3.5 py-1.5 rounded-lg text-sm font-medium transition-colors duration-150",
                    active
                      ? "text-accent-primary"
                      : "text-text-secondary hover:text-text-primary hover:bg-white/[0.04]"
                  )}
                >
                  {label}
                  {active && (
                    <motion.span
                      layoutId="nav-pill"
                      className="absolute inset-0 rounded-lg bg-accent-primary/10"
                      transition={{ type: "spring", stiffness: 380, damping: 36 }}
                    />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center">
            <Button variant="primary" size="sm" href="#newsletter">
              Subscribe
            </Button>
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden p-2 -mr-1 rounded-lg text-text-secondary hover:text-text-primary hover:bg-white/[0.04] transition-colors"
            onClick={() => setMobileOpen((o) => !o)}
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden"
              onClick={() => setMobileOpen(false)}
              aria-hidden="true"
            />

            {/* Drawer */}
            <motion.div
              key="drawer"
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              className="fixed top-16 left-0 right-0 z-50 bg-bg-primary/95 backdrop-blur-xl border-b border-border md:hidden"
            >
              <nav className="max-w-6xl mx-auto px-6 py-4 flex flex-col gap-1">
                {NAV_LINKS.map(({ label, href }) => {
                  const active = pathname === href;
                  return (
                    <Link
                      key={href}
                      href={href}
                      className={cn(
                        "px-4 py-3 rounded-xl text-base font-medium transition-colors",
                        active
                          ? "text-accent-primary bg-accent-primary/10"
                          : "text-text-secondary hover:text-text-primary hover:bg-white/[0.04]"
                      )}
                    >
                      {label}
                    </Link>
                  );
                })}
                <div className="pt-3 pb-1">
                  <Button
                    variant="primary"
                    size="md"
                    href="#newsletter"
                    className="w-full justify-center"
                  >
                    Subscribe to Newsletter
                  </Button>
                </div>
              </nav>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
