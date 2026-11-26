import type { Metadata } from "next";
import { PieceCard } from "@/components/PieceCard";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";
import { getPublished } from "@/lib/content";

export const metadata: Metadata = { title: "Search", robots: { index: false, follow: true }, alternates: { canonical: "/search" } };

export default async function SearchPage(props: PageProps<"/search">) {
  const sp = await props.searchParams;
  const q = typeof sp.q === "string" ? sp.q.trim() : "";
  const words = q.toLowerCase().split(/\s+/).filter(Boolean);
  const all = await getPublished();
  const results = words.length ? all.filter((p) => words.every((w) => `${p.title} ${p.subtitle} ${p.category} ${p.tags.join(" ")}`.toLowerCase().includes(w))) : [];
  return (
    <>
      <SiteHeader />
      <main id="main" className="wrap" style={{ paddingTop: 56, paddingBottom: 96, maxWidth: 980 }}>
        <h1 className="display" style={{ fontSize: "clamp(44px, 5vw, 72px)", marginBottom: 20 }}>Search</h1>
        <form role="search" action="/search" style={{ display: "flex", gap: 8, marginBottom: 28 }}>
          <label htmlFor="q" className="sr-only">Search everything</label>
          <input id="q" name="q" type="search" className="input" defaultValue={q} placeholder="Articles, case studies, breakdowns, issues" autoFocus style={{ minHeight: 54 }} />
          <button className="btn btn-dark" type="submit" style={{ minHeight: 54 }}>Search</button>
        </form>
        {q ? <p className="muted" aria-live="polite">{results.length} {results.length === 1 ? "result" : "results"} for &ldquo;{q}&rdquo;</p> : null}
        <div style={{ borderTop: q ? "2px solid var(--graphite)" : undefined }}>{results.map((p) => <PieceCard key={p.id} piece={p} size="row" />)}</div>
      </main>
      <SiteFooter />
    </>
  );
}
