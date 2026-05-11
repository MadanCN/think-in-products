import type { Metadata } from "next";
import { Card } from "@/components/ui";
import { FileText, Map, Briefcase, Users, TrendingUp, Eye } from "lucide-react";

export const metadata: Metadata = { title: "Dashboard — Admin" };

const stats = [
  { label: "Published Articles", value: "12", icon: FileText, delta: "+2 this month" },
  { label: "Roadmap Nodes", value: "24", icon: Map, delta: "6 coming soon" },
  { label: "Case Studies", value: "8", icon: Briefcase, delta: "+1 this month" },
  { label: "Subscribers", value: "347", icon: Users, delta: "+28 this week" },
  { label: "Monthly Visitors", value: "4.2k", icon: Eye, delta: "+18% MoM" },
  { label: "Avg. Read Time", value: "6.4 min", icon: TrendingUp, delta: "↑ from 5.1 min" },
];

const recentActivity = [
  { action: "Article published", item: "The Prioritisation Trap", time: "2h ago" },
  { action: "New subscriber", item: "alex@pm-curious.io", time: "4h ago" },
  { action: "Case study drafted", item: "B2B Onboarding Redesign", time: "1d ago" },
  { action: "Roadmap node updated", item: "Cross-functional Collaboration", time: "2d ago" },
];

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-bold text-text-primary">Dashboard</h1>
        <p className="text-text-secondary text-sm mt-1">Content overview and site activity.</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label} className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-text-muted text-xs font-mono mb-2">{stat.label}</p>
                  <p className="font-display text-3xl font-bold text-text-primary">{stat.value}</p>
                  <p className="text-text-muted text-xs mt-1">{stat.delta}</p>
                </div>
                <div className="p-2 rounded-lg bg-accent-primary/10">
                  <Icon className="w-4 h-4 text-accent-primary" />
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Recent activity */}
      <div>
        <h2 className="font-display text-base font-semibold text-text-primary mb-4">
          Recent Activity
        </h2>
        <Card className="divide-y divide-border">
          {recentActivity.map((item, i) => (
            <div key={i} className="flex items-center justify-between px-5 py-3">
              <div>
                <span className="text-text-muted text-xs font-mono mr-2">{item.action}</span>
                <span className="text-text-secondary text-sm">{item.item}</span>
              </div>
              <span className="font-mono text-xs text-text-muted shrink-0">{item.time}</span>
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
}
