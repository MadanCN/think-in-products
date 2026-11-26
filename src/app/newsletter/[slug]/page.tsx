import { PiecePage, pieceMeta } from "@/components/PiecePage";
import { getPublished } from "@/lib/content";

export const revalidate = 300;

export async function generateStaticParams() {
  return (await getPublished("newsletter")).map((p) => ({ slug: p.slug }));
}

export async function generateMetadata(props: PageProps<"/newsletter/[slug]">) {
  const { slug } = await props.params;
  return pieceMeta("newsletter", slug);
}

export default async function Page(props: PageProps<"/newsletter/[slug]">) {
  const { slug } = await props.params;
  return <PiecePage type="newsletter" slug={slug} />;
}
