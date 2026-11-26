"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { loadMe } from "./useMe";

type Card = { id: string; title: string; url: string; type: string; minutes: number; cover: string };
type Data = { signedIn: true; name: string; continue: (Card & { progress: number }) | null; recommended: Card[]; readCount: number };

// Shown only to signed-in readers, under the hero: pick up where you left off.
export function HomeWelcome() {
  const [d, setD] = useState<Data | null>(null);
  useEffect(() => {
    loadMe().then((me) => {
      if (!me.signedIn) return;
      fetch("/api/me/home", { cache: "no-store" })
        .then((r) => r.json())
        .then((x) => x.signedIn && setD(x))
        .catch(() => null);
    });
  }, []);
  if (!d) return null;
  return (
    <section className="wrap home-welcome" aria-label="For you">
      <div className="home-welcome-inner">
        <div className="home-welcome-hi">
          <p className="hand red" style={{ fontSize: 24, margin: 0 }}>welcome back, {d.name}</p>
          <p className="small" style={{ margin: "4px 0 0" }}>
            {d.readCount ? `You've opened ${d.readCount} piece${d.readCount === 1 ? "" : "s"}.` : "Your reading shows up on your profile."} <Link href="/account">Your profile</Link>
          </p>
        </div>
        {d.continue ? (
          <Link href={d.continue.url} className="continue-card">
            <span className="small" style={{ fontWeight: 700 }}>Continue reading · {d.continue.type}</span>
            <strong>{d.continue.title}</strong>
            <span className="progress" aria-label={`${d.continue.progress}% read`}><span style={{ width: `${Math.max(4, d.continue.progress)}%` }} /></span>
          </Link>
        ) : null}
        {d.recommended.slice(0, d.continue ? 2 : 3).map((p) => (
          <Link key={p.id} href={p.url} className="continue-card rec">
            <span className="small" style={{ fontWeight: 700 }}>For you · {p.type}</span>
            <strong>{p.title}</strong>
            <span className="small">{p.minutes} min read</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
