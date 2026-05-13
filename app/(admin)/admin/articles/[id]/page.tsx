import { notFound } from "next/navigation";
import { getArticle } from "@/app/actions/articles";
import { ArticleEditor } from "@/components/admin/articles/ArticleEditor";

export const dynamic = 'force-dynamic';

export default async function ArticleEditorPage({
  params,
}: {
  params: { id: string };
}) {
  const article = await getArticle(params.id);
  if (!article) notFound();
  return <ArticleEditor article={article} />;
}
