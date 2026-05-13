import type { MetadataRoute } from "next";
import { createServerAnonClient } from "@/lib/supabase";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://thinkinproducts.com";

const STATIC: Array<{
  path: string;
  priority: number;
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
}> = [
  { path: "/",          priority: 1.0, changeFrequency: "daily"   },
  { path: "/learn",     priority: 0.9, changeFrequency: "daily"   },
  { path: "/portfolio", priority: 0.9, changeFrequency: "weekly"  },
  { path: "/roadmap",   priority: 0.8, changeFrequency: "weekly"  },
  { path: "/about",     priority: 0.7, changeFrequency: "monthly" },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const db = createServerAnonClient();

  const [articlesRes, portfolioRes] = await Promise.all([
    db
      .from("articles")
      .select("slug, updated_at, published_at")
      .eq("status", "published"),
    db
      .from("portfolio_cases")
      .select("slug, updated_at")
      .eq("status", "published"),
  ]);

  const staticUrls: MetadataRoute.Sitemap = STATIC.map(({ path, priority, changeFrequency }) => ({
    url: `${SITE_URL}${path}`,
    lastModified: new Date(),
    changeFrequency,
    priority,
  }));

  const articleUrls: MetadataRoute.Sitemap = (articlesRes.data ?? []).map((a) => ({
    url: `${SITE_URL}/learn/${a.slug}`,
    lastModified: new Date(a.updated_at ?? a.published_at ?? Date.now()),
    changeFrequency: "monthly" as const,
    priority: 0.8,
  }));

  const portfolioUrls: MetadataRoute.Sitemap = (portfolioRes.data ?? []).map((c) => ({
    url: `${SITE_URL}/portfolio/${c.slug}`,
    lastModified: new Date(c.updated_at ?? Date.now()),
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  return [...staticUrls, ...articleUrls, ...portfolioUrls];
}
