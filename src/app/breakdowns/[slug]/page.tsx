import { PiecePage, pieceMeta } from "@/components/PiecePage";
import { getPublished } from "@/lib/content";

export const revalidate = 300;

export async function generateStaticParams() {
  return (await getPublished("breakdown")).map((p) => ({ slug: p.slug }));
}

export async function generateMetadata(props: PageProps<"/breakdowns/[slug]">) {
  const { slug } = await props.params;
  return pieceMeta("breakdown", slug);
}

export default async function Page(props: PageProps<"/breakdowns/[slug]">) {
  const { slug } = await props.params;
  return <PiecePage type="breakdown" slug={slug} />;
}
