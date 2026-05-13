import type { Metadata } from "next";
import { getSubscribers, getSubscriberStats } from "@/app/actions/newsletter";
import { SubscriberList } from "@/components/admin/newsletter/SubscriberList";

export const dynamic = 'force-dynamic';

export const metadata: Metadata = { title: "Newsletter — Admin" };

export default async function AdminNewsletterPage() {
  const [subscribers, stats] = await Promise.all([
    getSubscribers(),
    getSubscriberStats(),
  ]);

  return <SubscriberList subscribers={subscribers} stats={stats} />;
}
