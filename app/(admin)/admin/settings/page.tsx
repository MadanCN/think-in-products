import type { Metadata } from "next";
import { getSettings } from "@/app/actions/settings";
import { SettingsEditor } from "@/components/admin/settings/SettingsEditor";

export const metadata: Metadata = { title: "Site Settings — Admin" };

export default async function AdminSettingsPage() {
  const settings = await getSettings();
  return <SettingsEditor initialSettings={settings} />;
}
