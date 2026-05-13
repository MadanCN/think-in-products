import { notFound } from "next/navigation";
import { getAdminCase } from "@/app/actions/portfolio";
import { CaseStudyEditor } from "@/components/admin/portfolio/CaseStudyEditor";

export default async function CaseStudyEditorPage({
  params,
}: {
  params: { id: string };
}) {
  const c = await getAdminCase(params.id);
  if (!c) notFound();
  return <CaseStudyEditor caseStudy={c} />;
}
