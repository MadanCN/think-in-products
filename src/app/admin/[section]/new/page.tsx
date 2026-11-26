import { notFound } from "next/navigation";
import { EditorLoader } from "@/components/admin/EditorLoader";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { sectionFromAdminSlug } from "@/lib/types";

export const metadata = { title: "New piece" };

export default async function NewPiece(props: PageProps<"/admin/[section]/new">) {
  const type = sectionFromAdminSlug((await props.params).section)?.type;
  if (!type) notFound();
  return <EditorLoader key={type} type={type} local={!isSupabaseConfigured} />;
}
