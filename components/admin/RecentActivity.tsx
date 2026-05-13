"use client";

import { useEffect, useState } from "react";
import { getRecentActivity, type ActivityEntry } from "@/app/actions/activity";

const ENTITY_ICONS: Record<string, string> = {
  article:        "📄",
  portfolio:      "💼",
  roadmap_phase:  "🗺️",
  roadmap_node:   "📍",
  broadcast:      "📧",
  settings:       "⚙️",
  subscriber:     "👤",
};

const ACTION_LABELS: Record<string, string> = {
  article_created:       "Draft created",
  article_updated:       "Article updated",
  article_published:     "Article published",
  article_deleted:       "Article deleted",
  portfolio_created:     "Case created",
  portfolio_updated:     "Case updated",
  portfolio_published:   "Case published",
  portfolio_deleted:     "Case deleted",
  roadmap_phase_created: "Phase created",
  roadmap_phase_deleted: "Phase deleted",
  roadmap_node_created:  "Node added",
  roadmap_node_deleted:  "Node removed",
  broadcast_created:     "Broadcast created",
  broadcast_sent:        "Broadcast sent",
  broadcast_deleted:     "Broadcast deleted",
  settings_updated:      "Settings updated",
  subscriber_added:      "New subscriber",
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60_000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  return `${Math.floor(d / 30)}mo ago`;
}

export default function RecentActivity() {
  const [entries, setEntries] = useState<ActivityEntry[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const data = await getRecentActivity(10);
        if (!cancelled) {
          setEntries(data);
          setLoaded(true);
        }
      } catch {
        if (!cancelled) setLoaded(true);
      }
    }

    load();
    const timer = setInterval(load, 30_000);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, []);

  if (!loaded || entries.length === 0) return null;

  return (
    <div>
      <p className="font-mono text-2xs text-text-muted uppercase tracking-widest px-3 mb-2">
        Activity
      </p>
      <div className="space-y-0.5">
        {entries.map((entry) => (
          <div
            key={entry.id}
            className="flex gap-2 px-2 py-1.5 rounded-lg hover:bg-white/5 transition-colors"
          >
            <span className="text-sm shrink-0 mt-px leading-none">
              {ENTITY_ICONS[entry.entity_type] ?? "●"}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-text-secondary leading-tight font-mono truncate">
                {ACTION_LABELS[entry.action] ?? entry.action}
              </p>
              {entry.entity_name && (
                <p className="text-2xs text-text-muted truncate mt-0.5">
                  {entry.entity_name}
                </p>
              )}
              <p className="font-mono text-2xs text-text-muted/50 mt-0.5">
                {timeAgo(entry.created_at)}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
