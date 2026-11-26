import { PiecePage, pieceMeta } from "@/components/PiecePage";
import { getPublished } from "@/lib/content";

export const revalidate = 300;

export async function generateStaticParams() {
  return (await getPublished("case_study")).map((p) => ({ slug: p.slug }));
}

export async function generateMetadata(props: PageProps<"/case-studies/[slug]">) {
  const { slug } = await props.params;
  return pieceMeta("case_study", slug);
}

export default async function Page(props: PageProps<"/case-studies/[slug]">) {
  const { slug } = await props.params;
  return <PiecePage type="case_study" slug={slug} />;
}
