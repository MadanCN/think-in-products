import type { Metadata } from "next";
import { getRecentActivity } from "@/app/actions/activity";
import AuditLogTable from "@/components/admin/AuditLogTable";

export const metadata: Metadata = { title: "Audit Log — Admin" };

export default async function AuditLogPage() {
  const entries = await getRecentActivity(200);
  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-text-primary">Audit Log</h1>
        <p className="text-text-secondary text-sm mt-1">
          All admin actions — creates, updates, publishes, deletions, and broadcasts.
        </p>
      </div>
      <AuditLogTable entries={entries} />
    </div>
  );
}
