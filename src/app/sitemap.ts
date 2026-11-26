import type { MetadataRoute } from "next";
import { getPublished } from "@/lib/content";
import { abs } from "@/lib/seo";
import { SECTION_LIST, pieceUrl } from "@/lib/types";

export const revalidate = 3600;

// Every public page and every published piece, so Google can find them all.
import { listAuthors } from "@/lib/repo";
import { authorUrl } from "@/lib/types";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const pieces = await getPublished();
  const latest = pieces[0]?.updated_at ?? pieces[0]?.published_at ?? undefined;
  return [
    { url: abs("/"), lastModified: latest, changeFrequency: "weekly", priority: 1 },
    ...SECTION_LIST.map((s) => ({ url: abs(s.path), lastModified: latest, changeFrequency: "weekly" as const, priority: 0.8 })),
    { url: abs("/subscribe"), changeFrequency: "monthly", priority: 0.6 },
    { url: abs("/about"), changeFrequency: "yearly", priority: 0.4 },
    { url: abs("/plans"), changeFrequency: "monthly", priority: 0.4 },
    { url: abs("/contact"), changeFrequency: "yearly", priority: 0.3 },
    { url: abs("/write-for-us"), changeFrequency: "yearly", priority: 0.4 },
    ...(await listAuthors()).map((a) => ({ url: abs(authorUrl(a.slug)), changeFrequency: "monthly" as const, priority: 0.5, images: a.photo ? [abs(a.photo)] : undefined })),
    ...pieces.map((p) => ({
      url: abs(pieceUrl(p)),
      lastModified: p.updated_at ?? p.published_at ?? undefined,
      changeFrequency: "monthly" as const,
      priority: p.type === "newsletter" ? 0.5 : 0.9,
      images: p.cover?.src ? [abs(p.cover.src)] : undefined,
    })),
  ];
}
