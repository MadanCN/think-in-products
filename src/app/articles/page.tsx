import type { Metadata } from "next";
import { SectionIndex } from "@/components/SectionIndex";
import { ogImageFor } from "@/lib/seo";
import { SECTIONS } from "@/lib/types";

const s = SECTIONS.article;

export const metadata: Metadata = {
  title: s.plural,
  description: s.blurb,
  alternates: { canonical: s.path },
  openGraph: { title: `${s.plural} | ThinkInProducts`, description: s.blurb, url: s.path, images: [ogImageFor(s.plural, "ThinkInProducts")] },
};

export default async function Page(props: PageProps<"/articles">) {
  const sp = await props.searchParams;
  return <SectionIndex type="article" q={typeof sp.q === "string" ? sp.q : undefined} category={typeof sp.category === "string" ? sp.category : undefined} />;
}
