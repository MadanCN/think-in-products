import { redirect } from "next/navigation";
import { FullPreview } from "@/components/admin/FullPreview";
import { isAdmin } from "@/lib/admin-auth";

export default async function PreviewPage(props: PageProps<"/admin/preview">) {
  if (!(await isAdmin())) redirect("/admin/login");
  const sp = await props.searchParams;
  const id = typeof sp.id === "string" ? sp.id : "";
  return <FullPreview id={id} />;
}
