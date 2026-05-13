import * as React from "react";
import {
  Html, Head, Preview, Body, Container, Section,
  Text, Link, Hr, Img, Row, Column,
} from "@react-email/components";

export interface WelcomeEmailProps {
  greeting?: string;          // e.g. "Hey Madan," — pre-built by the caller
  bodyHtml?: string;          // admin-stored markdown rendered to HTML
  subject?: string;
  unsubscribeUrl: string;
  siteUrl: string;
}

export default function WelcomeEmail({
  greeting,
  bodyHtml,
  unsubscribeUrl,
  siteUrl,
}: WelcomeEmailProps) {
  return (
    <Html lang="en">
      <Head />
      <Preview>Welcome to Think In Products — let&apos;s think clearly about product.</Preview>
      <Body style={s.body}>
        <Container style={s.container}>

          {/* Header */}
          <Section style={s.header}>
            <Row>
              <Column style={{ width: "40px", verticalAlign: "middle", paddingRight: "10px" }}>
                <Img
                  src="https://i.postimg.cc/8zMFDKGG/logo.png"
                  alt=""
                  width="32"
                  height="32"
                  style={{ display: "block" }}
                />
              </Column>
              <Column style={{ verticalAlign: "middle" }}>
                <Text style={s.logo}>
                  <span style={s.logoAccent}>Think In</span> Products
                </Text>
              </Column>
            </Row>
          </Section>

          <Hr style={s.divider} />

          {/* Main body */}
          <Section style={s.main}>
            {greeting && (
              <Text style={{ ...s.text, color: "#F1F5F9", fontWeight: "600", marginBottom: "20px" }}>
                {greeting}
              </Text>
            )}

            {bodyHtml ? (
              /* Render admin-authored content */
              <div dangerouslySetInnerHTML={{ __html: bodyHtml }} />
            ) : (
              /* Fallback */
              <>
                <Text style={s.headline}>Welcome. Let&rsquo;s think in products.</Text>
                <Text style={s.text}>
                  I&rsquo;m Madan — a PM who spent years learning product the hard way.
                  Think In Products is my attempt to fix that: a structured learning space
                  built around the craft of product work — not the hype, not the listicles.
                </Text>
              </>
            )}

            <Section style={s.ctaSection}>
              <Link href={`${siteUrl}/roadmap`} style={s.ctaButton}>
                Explore the Roadmap &rarr;
              </Link>
            </Section>
          </Section>

          <Hr style={s.divider} />

          {/* Footer */}
          <Section style={s.footer}>
            <Text style={s.footerText}>
              You&rsquo;re receiving this because you subscribed at{" "}
              <Link href={siteUrl} style={s.footerLink}>thinkinproducts.com</Link>.{" "}
              <Link href={unsubscribeUrl} style={s.footerLink}>Unsubscribe</Link>
            </Text>
          </Section>

        </Container>
      </Body>
    </Html>
  );
}

const s = {
  body: {
    backgroundColor: "#080C14",
    fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
    margin: "0",
    padding: "0",
  },
  container: { maxWidth: "560px", margin: "0 auto", padding: "0 24px" },
  header: { paddingTop: "40px", paddingBottom: "20px" },
  logo: { fontSize: "20px", fontWeight: "800", color: "#F1F5F9", margin: "0", letterSpacing: "-0.02em" },
  logoAccent: { color: "#00E5CC" },
  divider: { borderColor: "#1E293B", borderTopWidth: "1px", margin: "24px 0" },
  main: { paddingBottom: "8px" },
  headline: { fontSize: "26px", fontWeight: "700", color: "#F1F5F9", lineHeight: "1.3", letterSpacing: "-0.02em", margin: "0 0 20px" },
  text: { fontSize: "15px", color: "#94A3B8", lineHeight: "1.75", margin: "0 0 14px" },
  ctaSection: { textAlign: "center" as const, paddingTop: "28px", paddingBottom: "8px" },
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
  footer: { paddingBottom: "40px" },
  footerText: { fontSize: "12px", color: "#334155", lineHeight: "1.6", margin: "0" },
  footerLink: { color: "#475569" },
};
