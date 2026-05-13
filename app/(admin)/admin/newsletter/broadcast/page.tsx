import type { Metadata } from "next";
import { getBroadcastsWithStats, getSubscriberStats } from "@/app/actions/newsletter";
import { BroadcastEditor } from "@/components/admin/newsletter/BroadcastEditor";

export const dynamic = 'force-dynamic';

export const metadata: Metadata = { title: "Broadcast — Admin" };

export default async function AdminBroadcastPage() {
  const [broadcasts, stats] = await Promise.all([
    getBroadcastsWithStats(),
    getSubscriberStats(),
  ]);

  return <BroadcastEditor broadcasts={broadcasts} activeCount={stats.active} />;
}
