import type { Metadata } from "next";
import { Badge } from "@/components/ui";
import { Button } from "@/components/ui";
import { getSettings } from "@/app/actions/settings";
import AuthorSection from "@/components/about/AuthorSection";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "About",
  description:
    "Why Think in Products exists — a startup PM's learning journal, built in public for anyone on the same journey.",
};

export default async function AboutPage() {
  const settings = await getSettings();
  const { profile, social, about } = settings;

  const headline   = about.headline    || "About Think in Products";
  const subheadline = about.subheadline || "A structured learning space for aspiring and practising product managers.";

  // Parse body into paragraphs (simple split on blank lines)
  const bodyParagraphs = about.body
    ? about.body.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean)
    : [];

  return (
    <div className="min-h-screen pt-32 pb-24 px-6">
      <div className="max-w-4xl mx-auto space-y-20">

        {/* ── Hero ── */}
        <section className="space-y-6">
          <Badge variant="outline" className="font-mono text-accent-primary border-accent-primary/30">
            About
          </Badge>

          <div className="flex items-start gap-5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="Think in Products logo" className="w-16 h-16 object-contain shrink-0 mt-1" />
            <div className="space-y-3">
              <h1 className="font-display text-4xl md:text-5xl font-bold text-text-primary">
                {headline}
              </h1>
              <p className="text-text-secondary text-lg leading-relaxed max-w-2xl">
                {subheadline}
              </p>
            </div>
          </div>

          {/* Author callout */}
          <div className="flex flex-wrap items-center gap-4 pt-2">
            <AuthorSection
              profile={profile}
              social={social}
              education={about.education}
              experience={about.experience}
              gallery={about.gallery}
            />
          </div>
        </section>

        {/* ── Body content (from settings or fallback) ── */}
        {bodyParagraphs.length > 0 ? (
          <section className="prose prose-invert max-w-none space-y-5">
            {bodyParagraphs.map((para, i) => (
              <p key={i} className="text-text-secondary leading-relaxed text-base">
                {para}
              </p>
            ))}
          </section>
        ) : (
          <div className="space-y-12">
            <section className="space-y-4">
              <h2 className="font-display text-2xl font-bold text-text-primary">
                What this is
              </h2>
              <p className="text-text-secondary leading-relaxed">
                Think in Products is my personal documentation of the PM craft — built as I learn it. I&rsquo;m a Product Executive at a startup with about two years in product, and this is where I write down what I&rsquo;m figuring out.
              </p>
              <p className="text-text-secondary leading-relaxed">
                Not expert advice. Not a course. Just honest notes from someone working through the same challenges you are — what I tested, what worked, what completely fell apart, and what I&rsquo;d do differently.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="font-display text-2xl font-bold text-text-primary">
                Why I built it
              </h2>
              <p className="text-text-secondary leading-relaxed">
                I found most PM content either too abstract to act on or too generic to be useful. I wanted something that reflected real startup product work — the messy decisions, the constraints, the trade-offs that don&rsquo;t show up in frameworks.
              </p>
              <p className="text-text-secondary leading-relaxed">
                Writing it down forces clarity. And if it helps someone else along the way, even better.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="font-display text-2xl font-bold text-text-primary">
                Who it&rsquo;s for
              </h2>
              <p className="text-text-secondary leading-relaxed">
                Mostly for myself — but also for anyone early in their product career who wants real notes over polished theory. If you&rsquo;re learning as you go, you&rsquo;re in the right place.
              </p>
            </section>
          </div>
        )}

        {/* ── CTA ── */}
        <section className="border-t border-border pt-10 space-y-4">
          <h2 className="font-display text-2xl font-bold text-text-primary">Follow along</h2>
          <p className="text-text-secondary leading-relaxed">
            I publish notes as I learn — no noise, just what I actually found useful and why.
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            <Button variant="primary" href="/roadmap">Start the Roadmap</Button>
            <Button variant="ghost" href="/contact">Get in Touch</Button>
          </div>
        </section>

      </div>
    </div>
  );
}