import Link from "next/link";
import { PieceCard } from "@/components/PieceCard";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";
import { SubscribeForm } from "@/components/SubscribeForm";
import { getPublished } from "@/lib/content";
import { JsonLd, abs } from "@/lib/seo";
import { SECTIONS, pieceUrl, type PieceType } from "@/lib/types";

// The index page for articles, case studies and product breakdowns:
// search, featured pieces, then everything grouped by category.
export async function SectionIndex({ type, q, category }: { type: PieceType; q?: string; category?: string }) {
  const s = SECTIONS[type];
  const all = await getPublished(type);
  const query = (q ?? "").trim().toLowerCase();
  const filtering = Boolean(query || category);
  const results = all.filter(
    (p) =>
      (!category || p.category === category) &&
      (!query || query.split(/\s+/).every((w) => `${p.title} ${p.subtitle} ${p.category} ${p.tags.join(" ")}`.toLowerCase().includes(w))),
  );
  const featured = all.filter((p) => p.featured);
  const cats = [...s.categories, ...all.map((p) => p.category).filter((c) => c && !s.categories.includes(c))].filter(
    (c, i, arr) => arr.indexOf(c) === i && all.some((p) => p.category === c),
  );
  const link = (c?: string) => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (c) params.set("category", c);
    const qs = params.toString();
    return `${s.path}${qs ? `?${qs}` : ""}`;
  };

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: `${s.plural} | ThinkInProducts`,
          description: s.blurb,
          url: abs(s.path),
          mainEntity: { "@type": "ItemList", itemListElement: all.slice(0, 20).map((p, i) => ({ "@type": "ListItem", position: i + 1, url: abs(pieceUrl(p)), name: p.title })) },
        }}
      />
      <SiteHeader active={type} />
      <main id="main">
        <section className="wrap index-hero">
          <div style={{ flex: "1 1 520px", minWidth: 0 }}>
            <span className="tag" style={{ background: s.color }}>{s.plural}</span>
            <h1 className="display" style={{ fontSize: "clamp(46px, 6vw, 84px)", margin: "16px 0 14px" }}>{s.plural}</h1>
            <p className="lead" style={{ margin: 0, maxWidth: 620 }}>{s.blurb}</p>
          </div>
          <form className="index-search" action={s.path} role="search">
            <label htmlFor="section-q" className="label">Search {s.plural.toLowerCase()}</label>
            <div style={{ display: "flex", gap: 8 }}>
              <input id="section-q" name="q" type="search" className="input" placeholder="e.g. pricing, Netflix, metrics" defaultValue={q} style={{ minHeight: 50 }} />
              {category ? <input type="hidden" name="category" value={category} /> : null}
              <button className="btn btn-dark" type="submit" style={{ minHeight: 50 }}>Search</button>
            </div>
          </form>
        </section>

        {cats.length ? (
          <nav className="wrap chips" aria-label="Categories">
            <Link href={link()} className={`chip${!category ? " on" : ""}`} aria-current={!category ? "page" : undefined}>All</Link>
            {cats.map((c) => (
              <Link key={c} href={link(c)} className={`chip${category === c ? " on" : ""}`} aria-current={category === c ? "page" : undefined}>
                {c} <span className="chip-n">{all.filter((p) => p.category === c).length}</span>
              </Link>
            ))}
          </nav>
        ) : null}

        {filtering ? (
          <section className="wrap" style={{ paddingTop: 24, paddingBottom: 80 }} aria-live="polite">
            <p className="muted" style={{ margin: "0 0 8px" }}>
              {results.length} {results.length === 1 ? "result" : "results"}
              {query ? <> for &ldquo;{q}&rdquo;</> : null}
              {category ? <> in {category}</> : null}. <Link href={s.path}>Clear</Link>
            </p>
            <div style={{ borderTop: "2px solid var(--graphite)" }}>
              {results.map((p) => <PieceCard key={p.id} piece={p} size="row" />)}
            </div>
            {results.length === 0 ? <p style={{ padding: "32px 0" }}>Nothing matches yet. Try a shorter word, or <Link href={s.path}>see everything</Link>.</p> : null}
          </section>
        ) : (
          <>
            {featured.length ? (
              <section className="wrap" style={{ paddingTop: 24, paddingBottom: 72 }} aria-labelledby="featured-h">
                <h2 id="featured-h" className="h2" style={{ fontSize: 36, marginBottom: 20 }}>Featured</h2>
                <div className={featured.length >= 3 ? "featured-grid" : "grid-3"}>
                  {featured.map((p, i) => <PieceCard key={p.id} piece={p} size={i === 0 && featured.length >= 3 ? "large" : "normal"} />)}
                </div>
              </section>
            ) : null}

            {/* Category shelves only once there's more than the featured row already shows. */}
            {(all.length > featured.length ? cats : []).map((c) => {
              const inCat = all.filter((p) => p.category === c);
              return (
                <section key={c} className="wrap" style={{ paddingBottom: 56 }} aria-labelledby={`cat-${c}`}>
                  <div className="section-head" style={{ marginBottom: 16 }}>
                    <h2 id={`cat-${c}`} className="h2" style={{ fontSize: 30 }}>{c}</h2>
                    {inCat.length > 3 ? <Link href={link(c)}>All {inCat.length}</Link> : null}
                  </div>
                  <div className="grid-3">{inCat.slice(0, 3).map((p) => <PieceCard key={p.id} piece={p} />)}</div>
                </section>
              );
            })}

            <section className="wrap" style={{ paddingBottom: 80 }} aria-labelledby="all-h">
              <h2 id="all-h" className="h2" style={{ fontSize: 30, marginBottom: 12 }}>Everything, newest first</h2>
              <div style={{ borderTop: "2px solid var(--graphite)" }}>
                {all.map((p) => <PieceCard key={p.id} piece={p} size="row" />)}
              </div>
              {all.length === 0 ? <p style={{ padding: "32px 0" }}>The first one is on its way. Subscribe below to hear when it&apos;s out.</p> : null}
            </section>
          </>
        )}

        <section className="wrap when-unsub" style={{ paddingBottom: 72 }}>
          <div className="taped" style={{ padding: "clamp(24px, 4vw, 40px)", display: "flex", flexWrap: "wrap", gap: "20px 48px", alignItems: "center" }}>
            <div style={{ flex: "1 1 360px" }}>
              <h2 style={{ margin: "0 0 6px", fontSize: 30, fontWeight: 800, fontStretch: "78%" }}>New {s.plural.toLowerCase()} are linked in the newsletter</h2>
              <p style={{ margin: 0, color: "var(--ink-2)" }}>One email a week. Unsubscribe in one click.</p>
            </div>
            <div style={{ flex: "1 1 360px" }}><SubscribeForm source={`index:${type}`} /></div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
