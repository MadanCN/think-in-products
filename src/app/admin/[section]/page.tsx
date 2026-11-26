import { notFound } from "next/navigation";
import { SectionList } from "@/components/admin/SectionList";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { SECTIONS, sectionFromAdminSlug } from "@/lib/types";

export async function generateMetadata(props: PageProps<"/admin/[section]">) {
  const type = sectionFromAdminSlug((await props.params).section)?.type;
  return { title: type ? (type === "newsletter" ? "Newsletters" : SECTIONS[type].plural) : "Admin" };
}

export default async function AdminSection(props: PageProps<"/admin/[section]">) {
  const type = sectionFromAdminSlug((await props.params).section)?.type;
  if (!type) notFound();
  return <SectionList key={type} type={type} local={!isSupabaseConfigured} />;
}
