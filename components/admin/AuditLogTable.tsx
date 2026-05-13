"use client";

import { useState } from "react";
import type { ActivityEntry } from "@/app/actions/activity";

const ENTITY_LABELS: Record<string, string> = {
  article:        "Article",
  portfolio:      "Case Study",
  roadmap_phase:  "Roadmap Phase",
  roadmap_node:   "Roadmap Node",
  broadcast:      "Broadcast",
  settings:       "Settings",
  subscriber:     "Subscriber",
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

const ACTION_COLORS: Record<string, string> = {
  article_published:   "text-emerald-400",
  portfolio_published: "text-emerald-400",
  broadcast_sent:      "text-emerald-400",
  article_deleted:     "text-rose-400",
  portfolio_deleted:   "text-rose-400",
  roadmap_phase_deleted: "text-rose-400",
  roadmap_node_deleted:  "text-rose-400",
  broadcast_deleted:   "text-rose-400",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

interface Props {
  entries: ActivityEntry[];
}

export default function AuditLogTable({ entries }: Props) {
  const [filter, setFilter] = useState("");

  const filtered = filter
    ? entries.filter(
        (e) =>
          e.action.includes(filter) ||
          e.entity_type.includes(filter) ||
          (e.entity_name?.toLowerCase().includes(filter.toLowerCase()) ?? false) ||
          (e.performed_by?.toLowerCase().includes(filter.toLowerCase()) ?? false)
      )
    : entries;

  if (entries.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-bg-card p-12 text-center">
        <p className="text-text-muted font-mono text-sm">No activity recorded yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <input
        type="search"
        placeholder="Filter by action, entity, or user…"
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        className="w-full max-w-sm px-3 py-2 rounded-lg border border-border bg-bg-card text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-accent-primary/50"
      />

      <div className="rounded-xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-bg-secondary/40">
              <th className="px-4 py-3 text-left font-mono text-2xs text-text-muted uppercase tracking-widest">
                Time
              </th>
              <th className="px-4 py-3 text-left font-mono text-2xs text-text-muted uppercase tracking-widest">
                Action
              </th>
              <th className="px-4 py-3 text-left font-mono text-2xs text-text-muted uppercase tracking-widest">
                Type
              </th>
              <th className="px-4 py-3 text-left font-mono text-2xs text-text-muted uppercase tracking-widest">
                Name
              </th>
              <th className="px-4 py-3 text-left font-mono text-2xs text-text-muted uppercase tracking-widest">
                By
              </th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-text-muted font-mono text-xs">
                  No entries match your filter.
                </td>
              </tr>
            ) : (
              filtered.map((entry, i) => (
                <tr
                  key={entry.id}
                  className={`border-b border-border/50 transition-colors hover:bg-white/[0.02] ${
                    i % 2 === 0 ? "" : "bg-bg-secondary/20"
                  }`}
                >
                  <td className="px-4 py-3 font-mono text-xs text-text-muted whitespace-nowrap">
                    {formatDate(entry.created_at)}
                  </td>
                  <td className={`px-4 py-3 font-mono text-xs whitespace-nowrap ${ACTION_COLORS[entry.action] ?? "text-text-secondary"}`}>
                    {ACTION_LABELS[entry.action] ?? entry.action}
                  </td>
                  <td className="px-4 py-3 text-xs text-text-muted">
                    {ENTITY_LABELS[entry.entity_type] ?? entry.entity_type}
                  </td>
                  <td className="px-4 py-3 text-xs text-text-primary max-w-xs truncate">
                    {entry.entity_name ?? <span className="text-text-muted">—</span>}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-text-muted truncate max-w-[140px]">
                    {entry.performed_by ?? "—"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {filtered.length > 0 && (
        <p className="font-mono text-2xs text-text-muted text-right">
          {filtered.length} {filtered.length === 1 ? "entry" : "entries"}
          {filter && ` matching "${filter}"`}
        </p>
      )}
    </div>
  );
}
