import type { Metadata } from "next";
import { getArticles } from "@/app/actions/articles";
import { ArticleList } from "@/components/admin/articles/ArticleList";

export const metadata: Metadata = { title: "Articles — Admin" };

export default async function AdminArticlesPage() {
  let articles: Awaited<ReturnType<typeof getArticles>> = [];
  try {
    articles = await getArticles();
  } catch {}
  return <ArticleList initialArticles={articles} />;
}
