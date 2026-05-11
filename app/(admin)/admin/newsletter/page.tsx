import type { Metadata } from "next";
import { Card } from "@/components/ui";
import { Button } from "@/components/ui";
import { Send, Users, TrendingUp, Mail } from "lucide-react";

export const metadata: Metadata = { title: "Newsletter — Admin" };

const subscribers = [
  { email: "pm@startup.io", subscribedAt: "2024-03-14", status: "active" },
  { email: "career@pmpath.com", subscribedAt: "2024-03-12", status: "active" },
  { email: "alex@pm-curious.io", subscribedAt: "2024-03-10", status: "active" },
  { email: "unsubscribed@example.com", subscribedAt: "2024-02-20", status: "unsubscribed" },
];

export default function AdminNewsletterPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-text-primary">Newsletter</h1>
          <p className="text-text-secondary text-sm mt-1">Subscribers and campaign overview.</p>
        </div>
        <Button variant="primary">
          <Send className="w-4 h-4 mr-2" />
          Compose Campaign
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Total Subscribers", value: "347", icon: Users },
          { label: "Open Rate", value: "42%", icon: Mail },
          { label: "Growth (30d)", value: "+28", icon: TrendingUp },
        ].map(({ label, value, icon: Icon }) => (
          <Card key={label} className="p-5 flex items-center gap-4">
            <div className="p-2 rounded-lg bg-accent-primary/10">
              <Icon className="w-4 h-4 text-accent-primary" />
            </div>
            <div>
              <p className="font-mono text-xs text-text-muted">{label}</p>
              <p className="font-display text-2xl font-bold text-text-primary">{value}</p>
            </div>
          </Card>
        ))}
      </div>

      {/* Subscriber list */}
      <div>
        <h2 className="font-display text-base font-semibold text-text-primary mb-3">Recent Subscribers</h2>
        <Card className="divide-y divide-border">
          {subscribers.map((s) => (
            <div key={s.email} className="flex items-center justify-between px-5 py-3">
              <div>
                <p className="text-sm text-text-primary">{s.email}</p>
                <p className="font-mono text-xs text-text-muted mt-0.5">{s.subscribedAt}</p>
              </div>
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded text-2xs font-mono border ${
                  s.status === "active"
                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                    : "bg-text-muted/10 text-text-muted border-text-muted/20"
                }`}
              >
                {s.status}
              </span>
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
}
