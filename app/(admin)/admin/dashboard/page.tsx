import type { Metadata } from "next";
import Link from "next/link";
import {
  FileText,
  Map,
  Briefcase,
  Users,
  PenLine,
  Plus,
  Send,
  Mail,
} from "lucide-react";
import { Card } from "@/components/ui";
import { createServerSupabaseClient } from "@/lib/supabase";

export const metadata: Metadata = { title: "Dashboard — Admin" };

// ─── Data fetchers ────────────────────────────────────────────────────────────

async function getStats() {
  try {
    const db = createServerSupabaseClient();
    const [subscribers, articles, portfolioCases, roadmapNodes] =
      await Promise.all([
        db
          .from("newsletter_subscribers")
          .select("*", { count: "exact", head: true })
          .eq("status", "active"),
        db
          .from("articles")
          .select("*", { count: "exact", head: true })
          .eq("status", "published"),
        db
          .from("portfolio_cases")
          .select("*", { count: "exact", head: true })
          .eq("status", "published"),
        db
          .from("roadmap_nodes")
          .select("*", { count: "exact", head: true })
          .eq("is_published", true),
      ]);
    return {
      subscribers: subscribers.count ?? 0,
      articles: articles.count ?? 0,
      portfolioCases: portfolioCases.count ?? 0,
      roadmapNodes: roadmapNodes.count ?? 0,
    };
  } catch {
    return { subscribers: 0, articles: 0, portfolioCases: 0, roadmapNodes: 0 };
  }
}

async function getRecentSubscribers() {
  try {
    const db = createServerSupabaseClient();
    const { data } = await db
      .from("newsletter_subscribers")
      .select("email, name, subscribed_at")
      .eq("status", "active")
      .order("subscribed_at", { ascending: false })
      .limit(5);
    return (data ?? []) as { email: string; name: string | null; subscribed_at: string }[];
  } catch {
    return [];
  }
}

async function getRecentArticles() {
  try {
    const db = createServerSupabaseClient();
    const { data } = await db
      .from("articles")
      .select("id, title, slug, status, published_at")
      .order("created_at", { ascending: false })
      .limit(3);
    return (data ?? []) as {
      id: string;
      title: string;
      slug: string;
      status: string;
      published_at: string | null;
    }[];
  } catch {
    return [];
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function DashboardPage() {
  const [stats, recentSubscribers, recentArticles] = await Promise.all([
    getStats(),
    getRecentSubscribers(),
    getRecentArticles(),
  ]);

  const statCards = [
    {
      label: "Active Subscribers",
      value: stats.subscribers,
      icon: Users,
      color: "text-accent-primary",
      bg: "bg-accent-primary/10",
    },
    {
      label: "Published Articles",
      value: stats.articles,
      icon: FileText,
      color: "text-accent-secondary",
      bg: "bg-accent-secondary/10",
    },
    {
      label: "Published Case Studies",
      value: stats.portfolioCases,
      icon: Briefcase,
      color: "text-amber-400",
      bg: "bg-amber-500/10",
    },
    {
      label: "Roadmap Nodes",
      value: stats.roadmapNodes,
      icon: Map,
      color: "text-violet-400",
      bg: "bg-violet-500/10",
    },
  ];

  const quickActions = [
    { label: "Add Roadmap Node", href: "/admin/roadmap", icon: Plus, desc: "Publish a new learning node" },
    { label: "Write Article", href: "/admin/articles", icon: PenLine, desc: "Draft a new PM insight" },
    { label: "Add Case Study", href: "/admin/portfolio", icon: Briefcase, desc: "Document a product case" },
    { label: "Newsletter", href: "/admin/newsletter", icon: Send, desc: "Manage subscribers" },
  ];

  return (
    <div className="space-y-10 max-w-5xl">
      {/* Page header */}
      <div>
        <h1 className="font-display text-2xl font-bold text-text-primary">
          Dashboard
        </h1>
        <p className="text-text-secondary text-sm mt-1">
          Content overview and live site stats.
        </p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map(({ label, value, icon: Icon, color, bg }) => (
          <Card key={label} className="p-5">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-mono text-xs text-text-muted mb-2 leading-snug">
                  {label}
                </p>
                <p className={`font-display text-3xl font-extrabold ${color}`}>
                  {value}
                </p>
              </div>
              <div className={`p-2 rounded-lg shrink-0 ${bg}`}>
                <Icon className={`w-4 h-4 ${color}`} />
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Recent activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent subscribers */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display text-sm font-semibold text-text-primary">
              Recent Subscribers
            </h2>
            <Link
              href="/admin/newsletter"
              className="font-mono text-xs text-text-muted hover:text-accent-primary transition-colors"
            >
              View all →
            </Link>
          </div>
          <Card>
            {recentSubscribers.length === 0 ? (
              <div className="px-5 py-8 text-center">
                <Mail className="w-6 h-6 text-text-muted mx-auto mb-2" />
                <p className="text-text-muted text-xs font-mono">
                  No subscribers yet
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-border">
                {recentSubscribers.map((s) => (
                  <li
                    key={s.email}
                    className="flex items-center justify-between px-5 py-3"
                  >
                    <div>
                      <p className="text-sm text-text-primary leading-snug">
                        {s.email}
                      </p>
                      {s.name && (
                        <p className="font-mono text-xs text-text-muted mt-0.5">
                          {s.name}
                        </p>
                      )}
                    </div>
                    <span className="font-mono text-xs text-text-muted shrink-0 ml-4">
                      {timeAgo(s.subscribed_at)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        {/* Recent articles */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display text-sm font-semibold text-text-primary">
              Recent Articles
            </h2>
            <Link
              href="/admin/articles"
              className="font-mono text-xs text-text-muted hover:text-accent-primary transition-colors"
            >
              View all →
            </Link>
          </div>
          <Card>
            {recentArticles.length === 0 ? (
              <div className="px-5 py-8 text-center">
                <FileText className="w-6 h-6 text-text-muted mx-auto mb-2" />
                <p className="text-text-muted text-xs font-mono">
                  No articles yet
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-border">
                {recentArticles.map((a) => (
                  <li
                    key={a.id}
                    className="flex items-center justify-between px-5 py-3 gap-4"
                  >
                    <p className="text-sm text-text-primary line-clamp-1 flex-1">
                      {a.title}
                    </p>
                    <span
                      className={`inline-flex shrink-0 items-center px-2 py-0.5 rounded text-2xs font-mono border ${
                        a.status === "published"
                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                          : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                      }`}
                    >
                      {a.status}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>

      {/* Quick actions */}
      <div>
        <h2 className="font-display text-sm font-semibold text-text-primary mb-3">
          Quick Actions
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map(({ label, href, icon: Icon, desc }) => (
            <Link
              key={href}
              href={href}
              className="group p-5 rounded-2xl border border-border bg-bg-card/40 hover:border-accent-primary/30 hover:bg-bg-card transition-all"
            >
              <div className="p-2 rounded-lg bg-accent-primary/10 w-fit mb-3">
                <Icon className="w-4 h-4 text-accent-primary" />
              </div>
              <p className="text-sm font-semibold text-text-primary group-hover:text-accent-primary transition-colors leading-snug mb-1">
                {label}
              </p>
              <p className="font-mono text-xs text-text-muted leading-snug">
                {desc}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
