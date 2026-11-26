import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PieceCard } from "@/components/PieceCard";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";
import { getPublished } from "@/lib/content";
import { renderMarkdown } from "@/lib/markdown";
import { getAuthor, listAuthors } from "@/lib/repo";
import { JsonLd, SITE_NAME, abs, ogImageFor, personJsonLd } from "@/lib/seo";
import { authorUrl } from "@/lib/types";

export const revalidate = 300;

export async function generateStaticParams() {
  return (await listAuthors()).map((a) => ({ slug: a.slug }));
}

export async function generateMetadata(props: PageProps<"/authors/[slug]">): Promise<Metadata> {
  const a = await getAuthor((await props.params).slug);
  if (!a) return { title: "Not found", robots: { index: false } };
  const description = a.short_bio || `${a.name} writes for ${SITE_NAME}.`;
  return {
    title: `${a.name}${a.role ? `, ${a.role}` : ""}`,
    description,
    alternates: { canonical: authorUrl(a.slug) },
    openGraph: { type: "profile", title: a.name, description, url: authorUrl(a.slug), images: a.photo ? [a.photo] : [ogImageFor(a.name, "Author")] },
  };
}

export default async function AuthorPage(props: PageProps<"/authors/[slug]">) {
  const a = await getAuthor((await props.params).slug);
  if (!a) notFound();
  const pieces = (await getPublished()).filter((p) => p.author === a.slug && p.type !== "newsletter");
  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "ProfilePage",
          url: abs(authorUrl(a.slug)),
          mainEntity: personJsonLd(a),
        }}
      />
      <SiteHeader />
      <main id="main" className="wrap" style={{ paddingTop: 56, paddingBottom: 96 }}>
        <div className="author-hero">
          {a.photo ? (
            <figure className="about-page-photo author-photo">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={a.photo} alt={`Photo of ${a.name}`} width={500} height={625} />
            </figure>
          ) : null}
          <div style={{ minWidth: 0 }}>
            <p className="hand red" style={{ fontSize: 24, margin: "0 0 6px" }}>the author</p>
            <h1 className="display" style={{ fontSize: "clamp(48px, 6vw, 84px)", margin: "0 0 8px" }}>{a.name}</h1>
            {a.role ? <p className="lead" style={{ margin: "0 0 20px" }}>{a.role}</p> : null}
            {a.bio ? <div className="prose" dangerouslySetInnerHTML={{ __html: renderMarkdown(a.bio) }} /> : <p>{a.short_bio}</p>}
            <div className="about-links" style={{ marginTop: 24 }}>
              {a.links.map((l) => (
                <a key={l.url} href={l.url} className="btn btn-sm" target="_blank" rel="me noopener noreferrer">{l.label || l.url} ↗</a>
              ))}
              <Link href="/contact" className="btn btn-sm btn-dark">Contact</Link>
            </div>
          </div>
        </div>

        {pieces.length ? (
          <section style={{ marginTop: 72 }} aria-labelledby="by-h">
            <h2 id="by-h" className="h2" style={{ fontSize: 34, marginBottom: 20 }}>Written by {a.name}</h2>
            <div className="stack" style={{ gap: 0 }}>{pieces.map((p) => <PieceCard key={p.id} piece={p} size="row" />)}</div>
          </section>
        ) : null}
      </main>
      <SiteFooter />
    </>
  );
}
