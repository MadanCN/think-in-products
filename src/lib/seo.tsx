import type { Metadata } from "next";
import { autoDescription } from "./blocks";
import { SITE_URL } from "./supabase/env";
import { SECTIONS, authorUrl, pieceUrl, type Author, type Piece } from "./types";

export const SITE_NAME = "ThinkInProducts";
export const SITE_TAGLINE = "A notebook for learning product management";
export const SITE_DESCRIPTION =
  "Learn product management by making the call first. Weekly articles and product breakdowns, a monthly deep case study, and a weekly newsletter with practical tips.";
export const AUTHOR_NAME = process.env.NEXT_PUBLIC_AUTHOR_NAME ?? "Madan";

export const abs = (path: string) => (path.startsWith("http") ? path : `${SITE_URL}${path}`);

export function ogImageFor(title: string, kicker: string) {
  return `/og?title=${encodeURIComponent(title)}&kicker=${encodeURIComponent(kicker)}`;
}

export function pieceMetadata(p: Piece, author?: Author | null): Metadata {
  const title = p.seo_title || p.title;
  const description = p.seo_description || autoDescription(p);
  const url = pieceUrl(p);
  const image = p.cover?.src || ogImageFor(p.title, SECTIONS[p.type].label);
  return {
    title,
    description,
    alternates: { canonical: url },
    keywords: p.tags,
    authors: [author ? { name: author.name, url: abs(authorUrl(author.slug)) } : { name: AUTHOR_NAME }],
    openGraph: {
      type: "article",
      url,
      title,
      description,
      siteName: SITE_NAME,
      publishedTime: p.published_at ?? undefined,
      modifiedTime: p.updated_at ?? p.published_at ?? undefined,
      section: p.category || SECTIONS[p.type].plural,
      tags: p.tags,
      images: [{ url: ogImageFor(p.title, SECTIONS[p.type].label), width: 1200, height: 630, alt: p.title }, ...(p.cover?.src ? [{ url: image, alt: p.cover.alt }] : [])],
    },
    twitter: { card: "summary_large_image", title, description, images: [ogImageFor(p.title, SECTIONS[p.type].label)] },
  };
}

// Structured data so Google understands each page (Article, breadcrumbs, the organisation).
export function pieceJsonLd(p: Piece, author?: Author | null) {
  const url = abs(pieceUrl(p));
  const section = SECTIONS[p.type];
  return [
    {
      "@context": "https://schema.org",
      "@type": p.type === "newsletter" ? "BlogPosting" : "Article",
      headline: p.title,
      description: p.seo_description || autoDescription(p),
      image: [abs(ogImageFor(p.title, section.label)), ...(p.cover?.src ? [abs(p.cover.src)] : [])],
      datePublished: p.published_at,
      dateModified: p.updated_at ?? p.published_at,
      author: author ? personJsonLd(author) : { "@type": "Person", name: AUTHOR_NAME, url: abs("/about") },
      publisher: { "@type": "Organization", name: SITE_NAME, logo: { "@type": "ImageObject", url: abs("/brand/mark-512.png") } },
      mainEntityOfPage: { "@type": "WebPage", "@id": url },
      articleSection: p.category || section.plural,
      keywords: p.tags.join(", "),
      timeRequired: `PT${p.reading_minutes}M`,
      isAccessibleForFree: p.access === "free",
      ...(p.access !== "free"
        ? { hasPart: { "@type": "WebPageElement", isAccessibleForFree: false, cssSelector: ".piece-body" } }
        : {}),
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: abs("/") },
        { "@type": "ListItem", position: 2, name: section.plural, item: abs(section.path) },
        { "@type": "ListItem", position: 3, name: p.title, item: url },
      ],
    },
  ];
}

export function siteJsonLd() {
  return [
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: SITE_NAME,
      url: abs("/"),
      logo: abs("/brand/mark-512.png"),
      description: SITE_DESCRIPTION,
    },
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: SITE_NAME,
      url: abs("/"),
      potentialAction: {
        "@type": "SearchAction",
        target: { "@type": "EntryPoint", urlTemplate: `${abs("/search")}?q={search_term_string}` },
        "query-input": "required name=search_term_string",
      },
    },
  ];
}

export function JsonLd({ data }: { data: unknown }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }} />;
}

export function personJsonLd(a: Author) {
  return {
    "@type": "Person",
    name: a.name,
    url: abs(authorUrl(a.slug)),
    ...(a.photo ? { image: abs(a.photo) } : {}),
    ...(a.role ? { jobTitle: a.role } : {}),
    ...(a.short_bio ? { description: a.short_bio } : {}),
    ...(a.links.length ? { sameAs: a.links.map((l) => l.url) } : {}),
  };
}
