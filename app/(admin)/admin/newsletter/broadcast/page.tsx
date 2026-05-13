import type { Metadata } from "next";
import { getBroadcasts, getSubscriberStats } from "@/app/actions/newsletter";
import { BroadcastEditor } from "@/components/admin/newsletter/BroadcastEditor";

export const metadata: Metadata = { title: "Broadcast — Admin" };

export default async function AdminBroadcastPage() {
  const [broadcasts, stats] = await Promise.all([
    getBroadcasts(),
    getSubscriberStats(),
  ]);

  return <BroadcastEditor broadcasts={broadcasts} activeCount={stats.active} />;
}
