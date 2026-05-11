"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Link2, Check } from "lucide-react";

interface Section {
  id: string;
  label: string;
}

const SECTIONS: Section[] = [
  { id: "problem", label: "Problem" },
  { id: "approach", label: "Approach" },
  { id: "outcome", label: "Outcome" },
  { id: "learnings", label: "Learnings" },
];

export function CaseStudySidebar() {
  const [active, setActive] = useState<string>("problem");
  const [copied, setCopied] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    const headings = SECTIONS.map((s) => document.getElementById(s.id)).filter(Boolean);

    observerRef.current = new IntersectionObserver(
      (entries) => {
        // Find the topmost visible section
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible.length > 0) {
          setActive(visible[0].target.id);
        }
      },
      { rootMargin: "-10% 0px -60% 0px", threshold: 0 }
    );

    headings.forEach((el) => observerRef.current!.observe(el!));
    return () => observerRef.current?.disconnect();
  }, []);

  function handleCopy() {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <aside className="hidden lg:flex flex-col gap-8 w-52 shrink-0">
      <Link
        href="/portfolio"
        className="inline-flex items-center gap-1.5 text-text-muted hover:text-text-primary transition-colors font-mono text-xs group"
      >
        <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5" />
        All work
      </Link>

      {/* Jump links */}
      <nav aria-label="Page sections">
        <p className="font-mono text-2xs text-text-muted uppercase tracking-widest mb-3">
          On this page
        </p>
        <ul className="flex flex-col gap-1">
          {SECTIONS.map((s) => (
            <li key={s.id}>
              <a
                href={`#${s.id}`}
                className={`
                  flex items-center gap-2.5 py-1.5 text-sm transition-colors
                  ${active === s.id
                    ? "text-accent-primary font-medium"
                    : "text-text-muted hover:text-text-secondary"
                  }
                `}
              >
                <span
                  className={`
                    w-px h-4 rounded-full transition-all
                    ${active === s.id ? "bg-accent-primary w-0.5 h-5" : "bg-border"}
                  `}
                />
                {s.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      {/* Share */}
      <button
        onClick={handleCopy}
        className="inline-flex items-center gap-2 text-xs font-mono text-text-muted hover:text-text-primary transition-colors"
      >
        {copied ? (
          <>
            <Check className="w-3.5 h-3.5 text-accent-primary" />
            <span className="text-accent-primary">Copied!</span>
          </>
        ) : (
          <>
            <Link2 className="w-3.5 h-3.5" />
            Copy link
          </>
        )}
      </button>
    </aside>
  );
}
