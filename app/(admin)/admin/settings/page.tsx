import type { Metadata } from "next";
import { Card } from "@/components/ui";
import { Settings } from "lucide-react";

export const metadata: Metadata = { title: "Site Settings — Admin" };

export default function AdminSettingsPage() {
  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="font-display text-2xl font-bold text-text-primary">
          Site Settings
        </h1>
        <p className="text-text-secondary text-sm mt-1">
          Global configuration for Think In Products.
        </p>
      </div>

      <Card className="p-10 flex flex-col items-center gap-3 text-center">
        <div className="p-3 rounded-xl bg-accent-primary/10">
          <Settings className="w-6 h-6 text-accent-primary" />
        </div>
        <p className="font-display text-base font-semibold text-text-primary">
          Coming soon
        </p>
        <p className="text-text-muted text-sm max-w-xs">
          Site-wide settings (SEO defaults, social links, feature flags) will
          be configurable here.
        </p>
      </Card>
    </div>
  );
}
