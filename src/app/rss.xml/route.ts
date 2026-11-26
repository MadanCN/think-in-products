import { autoDescription } from "@/lib/blocks";
import { getPublished } from "@/lib/content";
import { SITE_DESCRIPTION, SITE_NAME, abs } from "@/lib/seo";
import { SECTIONS, pieceUrl } from "@/lib/types";

export const revalidate = 3600;

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

// RSS feed of everything published, for feed readers and aggregators.
export async function GET() {
  const pieces = (await getPublished()).slice(0, 50);
  const items = pieces
    .map(
      (p) => `<item>
<title>${esc(p.title)}</title>
<link>${abs(pieceUrl(p))}</link>
<guid isPermaLink="true">${abs(pieceUrl(p))}</guid>
<category>${esc(SECTIONS[p.type].label)}</category>
<pubDate>${new Date(p.published_at ?? Date.now()).toUTCString()}</pubDate>
<description>${esc(p.seo_description || autoDescription(p))}</description>
</item>`,
    )
    .join("\n");
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
<channel>
<title>${SITE_NAME}</title>
<link>${abs("/")}</link>
<description>${esc(SITE_DESCRIPTION)}</description>
<language>en-in</language>
<atom:link href="${abs("/rss.xml")}" rel="self" type="application/rss+xml"/>
${items}
</channel>
</rss>`;
  return new Response(xml, { headers: { "content-type": "application/rss+xml; charset=utf-8", "cache-control": "public, max-age=3600" } });
}
