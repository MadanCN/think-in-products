import { PiecePage, pieceMeta } from "@/components/PiecePage";
import { getPublished } from "@/lib/content";

export const revalidate = 300;

export async function generateStaticParams() {
  return (await getPublished("article")).map((p) => ({ slug: p.slug }));
}

export async function generateMetadata(props: PageProps<"/articles/[slug]">) {
  const { slug } = await props.params;
  return pieceMeta("article", slug);
}

export default async function Page(props: PageProps<"/articles/[slug]">) {
  const { slug } = await props.params;
  return <PiecePage type="article" slug={slug} />;
}
