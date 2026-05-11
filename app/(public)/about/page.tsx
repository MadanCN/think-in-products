import type { Metadata } from "next";
import { Badge } from "@/components/ui";
import { Button } from "@/components/ui";

export const metadata: Metadata = {
  title: "About",
  description:
    "Why Think in Products exists, who it's for, and the philosophy behind how we teach product management.",
};

export default function AboutPage() {
  return (
    <div className="min-h-screen pt-32 pb-24 px-6">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-16 space-y-4">
          <Badge variant="outline" className="font-mono text-accent-primary border-accent-primary/30">
            Our Why
          </Badge>
          <h1 className="font-display text-4xl md:text-5xl font-bold text-text-primary">
            About Think in Products
          </h1>
        </div>

        {/* Main content */}
        <div className="prose prose-invert max-w-none space-y-10">
          <section className="space-y-4">
            <h2 className="font-display text-2xl font-bold text-text-primary">
              The problem with PM education
            </h2>
            <p className="text-text-secondary leading-relaxed">
              Most PM content sits at two useless extremes: vague think-pieces about &ldquo;shipping great products&rdquo; with no actionable depth, or 40-hour video courses packed with frameworks you&rsquo;ll never use. Neither builds the real skill.
            </p>
            <p className="text-text-secondary leading-relaxed">
              Real product thinking is learned by doing, reflecting, and doing again. The gap isn&rsquo;t knowledge — it&rsquo;s structured practice and honest feedback on your reasoning.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="font-display text-2xl font-bold text-text-primary">
              What this is
            </h2>
            <p className="text-text-secondary leading-relaxed">
              Think in Products is a curated learning environment for PMs who want to think more clearly about product work. The roadmap is structured, the articles go deep, and the case studies show the full messy reality — not just the after-shot.
            </p>
            <p className="text-text-secondary leading-relaxed">
              Everything here is opinionated. You won&rsquo;t find hedged, balanced-for-SEO content. You&rsquo;ll find a point of view, the reasoning behind it, and the humility to say when something didn&rsquo;t work.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="font-display text-2xl font-bold text-text-primary">
              Who it&rsquo;s for
            </h2>
            <ul className="space-y-3">
              {[
                "Aspiring PMs who want a structured path into the role — not just a list of books",
                "Early-career PMs (0–3 years) who want to level up their thinking and work quality",
                "Engineers and designers transitioning into product roles",
                "Anyone who cares about building things that actually matter to users",
              ].map((item) => (
                <li key={item} className="flex items-start gap-3 text-text-secondary">
                  <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-accent-primary shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="font-display text-2xl font-bold text-text-primary">
              Stay in the loop
            </h2>
            <p className="text-text-secondary leading-relaxed">
              New content drops every two weeks. No noise — just the piece and why it matters. Subscribe below or reach out if you want to collaborate.
            </p>
            <div className="flex gap-3 pt-2">
              <Button variant="primary" href="/roadmap">
                Start the Roadmap
              </Button>
              <Button variant="ghost" href="mailto:hello@thinkinproducts.com">
                Get in Touch
              </Button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
