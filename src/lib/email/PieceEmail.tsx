import { Body, Button, Container, Head, Hr, Html, Img, Link, Preview, Section, Text } from "@react-email/components";
import { renderMarkdown } from "../markdown";
import { PIECE_TYPE_LABEL, pieceUrl, type Block, type Piece } from "../types";

// Email version of a piece. Same blocks as the web page; anything interactive
// becomes a still version plus a button that takes the reader to the site.

const C = {
  pad: "#e8efe2",
  sheet: "#f7faf4",
  ink: "#22262b",
  ink2: "#3d434a",
  ink3: "#555c63",
  red: "#c8102e",
  blue: "#1f3fbf",
  yellow: "#ffe95c",
};
const font = "'Bricolage Grotesque', 'Segoe UI', Helvetica, Arial, sans-serif";
const hand = "'Kalam', 'Comic Sans MS', cursive";

function abs(src: string, siteUrl: string) {
  return src.startsWith("/") ? `${siteUrl}${src}` : src;
}

// Links written as /articles/... on the site must be absolute in an email.
function absLinks(html: string, siteUrl: string) {
  return html.replace(/href="\//g, `href="${siteUrl}/`);
}

function Credit({ credit, creditUrl }: { credit?: string; creditUrl?: string }) {
  if (!credit) return null;
  return <> Image: {creditUrl ? <Link href={creditUrl} style={{ color: C.ink3 }}>{credit}</Link> : credit}</>;
}

function OnSite({ href, label }: { href: string; label: string }) {
  return (
    <Button href={href} style={{ background: C.ink, color: C.sheet, borderRadius: 999, padding: "12px 22px", fontWeight: 700, fontSize: 15, textDecoration: "none" }}>
      {label}
    </Button>
  );
}

function EmailBlock({ block, url, siteUrl }: { block: Block; url: string; siteUrl: string }) {
  const here = `${url}#${block.id}`;
  switch (block.type) {
    case "text":
      return <div style={{ fontSize: 17, lineHeight: 1.65, color: C.ink }} dangerouslySetInnerHTML={{ __html: absLinks(renderMarkdown(block.markdown), siteUrl) }} />;
    case "image":
      return block.src ? (
        <Section>
          <Img src={abs(block.src, siteUrl)} alt={block.alt} width="100%" style={{ borderRadius: 10, border: `2px solid ${C.ink}` }} />
          {block.caption || block.credit ? <Text style={{ fontSize: 13, color: C.ink3, margin: "6px 0 0" }}>{block.caption}<Credit credit={block.credit} creditUrl={block.creditUrl} /></Text> : null}
        </Section>
      ) : null;
    case "tip":
      return (
        <Section style={{ background: "#ffffff", border: `2px solid ${C.ink}`, borderLeft: `10px solid ${C.red}`, padding: "16px 20px" }}>
          <Text style={{ margin: 0, fontSize: 13, fontWeight: 700, color: C.red }}>TiP · Think in Products tip</Text>
          {block.title ? <Text style={{ margin: "4px 0 4px", fontSize: 19, fontWeight: 800, color: C.ink }}>{block.title}</Text> : null}
          <Text style={{ margin: 0, fontSize: 16, lineHeight: 1.55, color: C.ink2 }}>{block.text}</Text>
        </Section>
      );
    case "stats":
      return (
        <Section>
          <table width="100%" cellPadding={0} cellSpacing={8} role="presentation">
            <tbody>
              <tr>
                {block.items.filter((i) => i.value).map((it, i) => (
                  <td key={i} style={{ background: C.sheet, border: `2px solid ${C.ink}`, borderRadius: 12, padding: "12px 14px", verticalAlign: "top" }}>
                    <div style={{ fontSize: 26, fontWeight: 800, lineHeight: 1.05 }}>{it.value}</div>
                    <div style={{ fontSize: 13, color: C.ink2, marginTop: 4 }}>{it.label}</div>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
          {block.source ? <Text style={{ fontSize: 12, color: C.ink3, margin: "4px 0 0" }}>Source: {block.source}</Text> : null}
        </Section>
      );
    case "timeline":
      return (
        <Section style={{ borderLeft: `3px solid ${C.ink}`, paddingLeft: 16 }}>
          {block.title ? <Text style={{ fontSize: 18, fontWeight: 800, margin: "0 0 10px" }}>{block.title}</Text> : null}
          {block.events.filter((e) => e.title).map((e, i) => (
            <Text key={i} style={{ fontSize: 15, margin: "0 0 10px", lineHeight: 1.5 }}>
              <strong>{e.date}: {e.title}.</strong> {e.text}
            </Text>
          ))}
          <div style={{ marginTop: 6 }}><OnSite href={here} label="See the timeline on the site" /></div>
        </Section>
      );
    case "sources":
      return (
        <Section style={{ borderTop: `1px solid #cfddc6`, paddingTop: 10 }}>
          <Text style={{ fontSize: 14, fontWeight: 700, margin: "0 0 6px" }}>Sources</Text>
          {block.items.filter((i) => i.label).map((it, i) => (
            <Text key={i} style={{ fontSize: 13, margin: "0 0 4px", color: C.ink3 }}>
              {it.url ? <Link href={it.url} style={{ color: C.ink3 }}>{it.label}</Link> : it.label}
            </Text>
          ))}
        </Section>
      );
    case "margin_note":
      return <Text style={{ fontFamily: hand, fontSize: 20, color: block.pen === "red" ? C.red : C.blue, margin: 0 }}>{block.text}</Text>;
    case "callout":
      return (
        <Section style={{ background: block.tone === "dark" ? C.ink : C.yellow, border: `2px solid ${C.ink}`, padding: "16px 20px" }}>
          <Text style={{ margin: 0, fontSize: 19, fontWeight: 700, color: block.tone === "dark" ? C.sheet : C.ink }}>{block.text}</Text>
        </Section>
      );
    case "make_the_call":
    case "check_yourself": {
      const isCall = block.type === "make_the_call";
      return (
        <Section style={{ background: isCall ? C.ink : C.sheet, border: `2px solid ${C.ink}`, borderRadius: isCall ? 14 : 0, padding: "22px 24px" }}>
          <Text style={{ fontFamily: hand, fontSize: 19, color: isCall ? C.yellow : C.red, margin: "0 0 6px" }}>{isCall ? "Make the call" : "Check yourself"}</Text>
          {isCall && block.scenario ? <Text style={{ fontSize: 18, fontWeight: 700, color: C.sheet, margin: "0 0 8px" }}>{block.scenario}</Text> : null}
          <Text style={{ fontSize: 17, fontWeight: 700, color: isCall ? C.sheet : C.ink, margin: "0 0 12px" }}>{block.question}</Text>
          {block.options.map((o, i) => (
            <Text key={o.id} style={{ fontSize: 16, color: isCall ? C.sheet : C.ink, border: `1.5px solid ${isCall ? "#6b7177" : C.ink}`, borderRadius: 10, padding: "8px 12px", margin: "0 0 8px" }}>
              {"ABCDEF"[i]}. {o.label}
            </Text>
          ))}
          <div style={{ marginTop: 14 }}>
            <Button href={here} style={{ background: isCall ? C.yellow : C.ink, color: isCall ? C.ink : C.sheet, borderRadius: 999, padding: "12px 22px", fontWeight: 700, fontSize: 15, textDecoration: "none" }}>
              Answer this on the site
            </Button>
          </div>
        </Section>
      );
    }
    case "marked_up_image":
      return (
        <Section>
          {block.src ? <Img src={abs(block.src, siteUrl)} alt={block.alt} width="320" style={{ margin: "0 auto", border: `2px solid ${C.ink}`, borderRadius: 18 }} /> : null}
          {block.credit ? <Text style={{ fontSize: 12, color: C.ink3, margin: "6px 0 0", textAlign: "center" }}><Credit credit={block.credit} creditUrl={block.creditUrl} /></Text> : null}
          {block.notes.map((n, i) => (
            <Text key={n.id} style={{ fontFamily: hand, fontSize: 18, color: n.pen === "red" ? C.red : C.blue, margin: "8px 0 0" }}>
              {i + 1}. {n.text}
            </Text>
          ))}
          <div style={{ marginTop: 12 }}><OnSite href={here} label="See it marked up on the site" /></div>
        </Section>
      );
    case "chart": {
      const rows = block.rows.filter((r) => r.label);
      const max = Math.max(1, ...rows.map((r) => Number(r.value) || 0));
      return (
        <Section style={{ background: C.sheet, border: `2px solid ${C.ink}`, padding: "18px 20px" }}>
          {block.title ? <Text style={{ fontSize: 18, fontWeight: 800, margin: "0 0 12px" }}>{block.title}</Text> : null}
          <table width="100%" cellPadding={0} cellSpacing={0} role="presentation">
            <tbody>
              {rows.map((r, i) => {
                const v = Number(r.value) || 0;
                return (
                  <tr key={i}>
                    <td style={{ fontSize: 14, padding: "4px 10px 4px 0", width: "38%", textAlign: "right" }}>{r.label}</td>
                    <td style={{ padding: "4px 0" }}>
                      <div style={{ width: `${Math.max(8, (v / max) * 100)}%`, background: v === max ? C.yellow : "#a9c8f0", border: `2px solid ${C.ink}`, fontSize: 13, fontWeight: 800, textAlign: "right", padding: "4px 8px", boxSizing: "border-box" }}>
                        {v}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {block.note ? <Text style={{ fontSize: 13, color: C.ink3, margin: "10px 0 0" }}>{block.note}</Text> : null}
        </Section>
      );
    }
    case "cause_arrows":
      return (
        <Section style={{ textAlign: "center" }}>
          <Text style={{ display: "inline-block", background: C.ink, color: C.sheet, fontSize: 19, fontWeight: 800, padding: "10px 18px", borderRadius: 12, margin: "0 0 10px" }}>{block.problem}</Text>
          {block.reasons.filter(Boolean).map((r, i) => (
            <Text key={i} style={{ fontSize: 16, border: `2px solid ${C.ink}`, borderRadius: 10, padding: "8px 12px", margin: "0 0 6px", background: C.sheet }}>
              <span style={{ color: C.red, fontWeight: 800 }}>↳ </span>{r}
            </Text>
          ))}
        </Section>
      );
    case "venn":
      return (
        <Section style={{ background: C.sheet, border: `2px solid ${C.ink}`, padding: "18px 20px" }}>
          {block.title ? <Text style={{ fontSize: 18, fontWeight: 800, margin: "0 0 10px" }}>{block.title}</Text> : null}
          {block.circles.filter((c) => c.label).map((c, i) => (
            <Text key={i} style={{ fontSize: 16, margin: "0 0 6px" }}><strong>{c.label}:</strong> {c.detail}</Text>
          ))}
          {block.overlap ? <Text style={{ fontFamily: hand, fontSize: 18, color: C.blue, margin: "8px 0 0" }}>{block.overlap}</Text> : null}
        </Section>
      );
    case "cycle":
      return (
        <Section style={{ textAlign: "center" }}>
          {block.title ? <Text style={{ fontSize: 18, fontWeight: 800, margin: "0 0 8px" }}>{block.title}</Text> : null}
          <Text style={{ fontSize: 17, fontWeight: 700, margin: 0 }}>
            {block.steps.filter(Boolean).join("  →  ")}  →  <span style={{ color: C.red }}>repeat</span>
          </Text>
        </Section>
      );
  }
}

export function PieceEmail({ piece, siteUrl, unsubscribeUrl }: { piece: Piece; siteUrl: string; unsubscribeUrl: string }) {
  const url = `${siteUrl}${pieceUrl(piece)}`;
  return (
    <Html lang="en">
      <Head />
      <Preview>{piece.subtitle || piece.title}</Preview>
      <Body style={{ background: C.pad, margin: 0, padding: "24px 0", fontFamily: font, color: C.ink }}>
        <Container style={{ maxWidth: 600, background: C.sheet, border: `2px solid ${C.ink}`, padding: "28px 28px 20px" }}>
          <Img src={`${siteUrl}/brand/logo.png`} alt="ThinkInProducts" width="190" style={{ display: "block" }} />
          <Hr style={{ borderColor: C.ink, borderWidth: 1, margin: "14px 0 20px" }} />
          <Text style={{ fontSize: 13, color: C.ink3, margin: 0 }}>{piece.issue_number ? `Issue #${piece.issue_number}` : PIECE_TYPE_LABEL[piece.type]}</Text>
          <Text style={{ fontSize: 34, lineHeight: 1.05, fontWeight: 800, margin: "6px 0 10px" }}>{piece.title}</Text>
          {piece.subtitle ? <Text style={{ fontSize: 18, color: C.ink2, margin: "0 0 22px" }}>{piece.subtitle}</Text> : null}
          {piece.blocks.map((b) => (
            <Section key={b.id} style={{ margin: "0 0 22px" }}>
              <EmailBlock block={b} url={url} siteUrl={siteUrl} />
            </Section>
          ))}
          <Section style={{ margin: "8px 0 0" }}>
            <OnSite href={url} label={piece.type === "newsletter" ? "Read this issue on the site" : "Read it on the site"} />
          </Section>
          <Hr style={{ borderColor: "#cfddc6", margin: "26px 0 12px" }} />
          <Text style={{ fontSize: 12, color: C.ink3, margin: 0 }}>
            You get this because you subscribed to ThinkInProducts. <Link href={unsubscribeUrl} style={{ color: C.ink3 }}>Unsubscribe</Link>
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
