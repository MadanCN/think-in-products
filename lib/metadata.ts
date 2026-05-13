import type { Metadata } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://thinkinproducts.com";
export const SITE_NAME = "Think in Products";
const DEFAULT_DESCRIPTION =
  "A structured learning hub for aspiring and practicing product managers — roadmaps, case studies, and PM frameworks built for real career growth.";

export interface MetaOptions {
  title?: string;
  description?: string;
  image?: string | null;
  path?: string;
  type?: "website" | "article";
  publishedTime?: string | null;
  modifiedTime?: string | null;
  authors?: string[];
  tags?: string[];
  noIndex?: boolean;
}

export function generateMeta({
  title,
  description = DEFAULT_DESCRIPTION,
  image,
  path = "",
  type = "website",
  publishedTime,
  modifiedTime,
  authors,
  tags,
  noIndex = false,
}: MetaOptions = {}): Metadata {
  const canonical = `${SITE_URL}${path}`;
  const ogImage = image ?? `${SITE_URL}/og-default.png`;

  const og: Metadata["openGraph"] = {
    type,
    siteName: SITE_NAME,
    title: title ?? SITE_NAME,
    description,
    url: canonical,
    images: [{ url: ogImage, width: 1200, height: 630, alt: title ?? SITE_NAME }],
  };

  if (type === "article") {
    if (publishedTime) (og as Record<string, unknown>).publishedTime = publishedTime;
    if (modifiedTime) (og as Record<string, unknown>).modifiedTime = modifiedTime;
    if (authors?.length) (og as Record<string, unknown>).authors = authors;
    if (tags?.length) (og as Record<string, unknown>).tags = tags;
  }

  return {
    title,
    description,
    keywords: tags,
    authors: authors?.map((name) => ({ name })),
    alternates: { canonical },
    robots: noIndex ? { index: false, follow: false } : { index: true, follow: true },
    openGraph: og,
    twitter: {
      card: "summary_large_image",
      title: title ?? SITE_NAME,
      description,
      images: [ogImage],
    },
  };
}
