import { EditorLoader } from "@/components/admin/EditorLoader";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export const metadata = { title: "Edit" };

export default async function EditPiece(props: PageProps<"/admin/edit/[id]">) {
  const { id } = await props.params;
  return <EditorLoader id={id} local={!isSupabaseConfigured} />;
}
