import * as React from "react";
import {
  Html,
  Head,
  Preview,
  Body,
  Container,
  Section,
  Text,
  Link,
  Hr,
} from "@react-email/components";

export interface WelcomeEmailProps {
  name?: string;
  unsubscribeUrl: string;
  siteUrl: string;
}

export default function WelcomeEmail({
  name,
  unsubscribeUrl,
  siteUrl,
}: WelcomeEmailProps) {
  const firstName = name?.split(" ")[0];
  const greeting = firstName ? `Hey ${firstName},` : "Hey,";

  return (
    <Html lang="en">
      <Head />
      <Preview>Welcome to Think In Products — let&apos;s think clearly about product.</Preview>
      <Body style={s.body}>
        <Container style={s.container}>

          {/* ── Header ────────────────────────────── */}
          <Section style={s.header}>
            <Text style={s.logo}>
              <span style={s.logoAccent}>Think In</span> Products
            </Text>
          </Section>

          <Hr style={s.divider} />

          {/* ── Main ──────────────────────────────── */}
          <Section style={s.main}>
            <Text style={s.headline}>
              Welcome. Let&rsquo;s think in products.
            </Text>

            <Text style={s.text}>{greeting}</Text>

            <Text style={s.text}>
              I&rsquo;m Madan — a PM who spent years learning product the hard
              way: scattered resources, generic advice, no real framework for
              developing a clear product sense.
            </Text>

            <Text style={s.text}>
              Think In Products is my attempt to fix that. It&rsquo;s a
              structured learning space built around the craft of product work
              — not the hype, not the listicles. Just the thinking that
              actually compounds.
            </Text>

            <Hr style={s.divider} />

            {/* What to expect */}
            <Text style={s.sectionLabel}>What to expect</Text>

            <Text style={s.expectItem}>
              <span style={s.teal}>→</span>{" "}
              <span style={s.bold}>PM Roadmap</span>{" "}
              <span style={s.dim}>—</span>{" "}
              A structured path from first principles to advanced product
              thinking, organised by phase and skill level.
            </Text>

            <Text style={s.expectItem}>
              <span style={s.teal}>→</span>{" "}
              <span style={s.bold}>Product Insights</span>{" "}
              <span style={s.dim}>—</span>{" "}
              Real frameworks distilled from building in health tech and
              beyond. No filler, no generic advice.
            </Text>

            <Text style={s.expectItem}>
              <span style={s.teal}>→</span>{" "}
              <span style={s.bold}>Case Studies</span>{" "}
              <span style={s.dim}>—</span>{" "}
              Annotated examples showing the full product lifecycle: the
              problem, the approach, the outcome, the honest lessons.
            </Text>

            {/* CTA */}
            <Section style={s.ctaSection}>
              <Link href={`${siteUrl}/roadmap`} style={s.ctaButton}>
                Explore the Roadmap &rarr;
              </Link>
            </Section>
          </Section>

          <Hr style={s.divider} />

          {/* ── Footer ────────────────────────────── */}
          <Section style={s.footer}>
            <Text style={s.footerText}>
              You&rsquo;re receiving this because you subscribed at{" "}
              <Link href={siteUrl} style={s.footerLink}>
                thinkinproducts.com
              </Link>
              .{" "}
              <Link href={unsubscribeUrl} style={s.footerLink}>
                Unsubscribe
              </Link>
            </Text>
          </Section>

        </Container>
      </Body>
    </Html>
  );
}

// ── Styles ──────────────────────────────────────────────────────────────────

const s = {
  body: {
    backgroundColor: "#080C14",
    fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
    margin: "0",
    padding: "0",
  },
  container: {
    maxWidth: "560px",
    margin: "0 auto",
    padding: "0 24px",
  },
  header: {
    paddingTop: "40px",
    paddingBottom: "20px",
  },
  logo: {
    fontSize: "20px",
    fontWeight: "800",
    color: "#F1F5F9",
    margin: "0",
    letterSpacing: "-0.02em",
  },
  logoAccent: {
    color: "#00E5CC",
  },
  divider: {
    borderColor: "#1E293B",
    borderTopWidth: "1px",
    margin: "24px 0",
  },
  main: {
    paddingBottom: "8px",
  },
  headline: {
    fontSize: "26px",
    fontWeight: "700",
    color: "#F1F5F9",
    lineHeight: "1.3",
    letterSpacing: "-0.02em",
    margin: "0 0 20px",
  },
  text: {
    fontSize: "15px",
    color: "#94A3B8",
    lineHeight: "1.75",
    margin: "0 0 14px",
  },
  sectionLabel: {
    fontSize: "11px",
    fontWeight: "600",
    color: "#475569",
    textTransform: "uppercase" as const,
    letterSpacing: "0.1em",
    margin: "0 0 14px",
    fontFamily: "monospace",
  },
  expectItem: {
    fontSize: "14px",
    color: "#94A3B8",
    lineHeight: "1.7",
    margin: "0 0 10px",
  },
  teal: { color: "#00E5CC" },
  bold: { color: "#F1F5F9", fontWeight: "600" },
  dim: { color: "#475569" },
  ctaSection: {
    textAlign: "center" as const,
    paddingTop: "28px",
    paddingBottom: "8px",
  },
  ctaButton: {
    display: "inline-block",
    backgroundColor: "#00E5CC",
    color: "#080C14",
    padding: "14px 32px",
    borderRadius: "10px",
    fontWeight: "700",
    fontSize: "15px",
    textDecoration: "none",
    letterSpacing: "-0.01em",
  },
  footer: {
    paddingBottom: "40px",
  },
  footerText: {
    fontSize: "12px",
    color: "#334155",
    lineHeight: "1.6",
    margin: "0",
  },
  footerLink: {
    color: "#475569",
  },
};
