import type { Metadata } from "next";
import { getWelcomeTemplate } from "@/app/actions/newsletter";
import { WelcomeEmailEditor } from "@/components/admin/newsletter/WelcomeEmailEditor";

export const metadata: Metadata = { title: "Welcome Email — Admin" };

export default async function WelcomeEmailPage() {
  const template = await getWelcomeTemplate();
  return <WelcomeEmailEditor initial={template} />;
}
