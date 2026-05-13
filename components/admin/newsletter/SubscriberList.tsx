"use client";

import { useState, useMemo } from "react";
import { Users, UserCheck, UserMinus, Download, Search } from "lucide-react";
import { DataTable } from "@/components/admin/DataTable";
import type { Column } from "@/components/admin/DataTable";
import type { AdminSubscriber, SubscriberStats } from "@/app/actions/newsletter";
import { cn } from "@/lib/utils";

const STATUS_STYLE: Record<AdminSubscriber["status"], string> = {
  active: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  unsubscribed: "bg-text-muted/10 text-text-muted border-text-muted/20",
  bounced: "bg-rose-500/10 text-rose-400 border-rose-500/20",
};

type Filter = "all" | "active" | "unsubscribed" | "bounced";
const FILTER_TABS: { key: Filter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "active", label: "Active" },
  { key: "unsubscribed", label: "Unsubscribed" },
  { key: "bounced", label: "Bounced" },
];

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function exportCsv(rows: AdminSubscriber[]) {
  const header = ["Email", "Name", "Status", "Source", "Subscribed At"];
  const lines = rows.map((r) =>
    [
      r.email,
      r.name ?? "",
      r.status,
      r.source ?? "",
      formatDate(r.subscribed_at),
    ]
      .map((v) => `"${String(v).replace(/"/g, '""')}"`)
      .join(",")
  );
  const csv = [header.join(","), ...lines].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `subscribers-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

interface Props {
  subscribers: AdminSubscriber[];
  stats: SubscriberStats;
}

export function SubscriberList({ subscribers, stats }: Props) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("all");

  const columns: Column<AdminSubscriber>[] = [
    {
      key: "email",
      label: "Email",
      sortable: true,
      render: (r) => (
        <span className="font-mono text-xs text-text-primary">{r.email}</span>
      ),
    },
    {
      key: "name",
      label: "Name",
      render: (r) => (
        <span className="text-sm text-text-secondary">{r.name ?? "—"}</span>
      ),
    },
    {
      key: "status",
      label: "Status",
      width: "120px",
      render: (r) => (
        <span
          className={cn(
            "inline-flex items-center px-2 py-0.5 rounded text-xs font-mono border",
            STATUS_STYLE[r.status]
          )}
        >
          {r.status}
        </span>
      ),
    },
    {
      key: "source",
      label: "Source",
      width: "120px",
      render: (r) => (
        <span className="font-mono text-xs text-text-muted">{r.source ?? "—"}</span>
      ),
    },
    {
      key: "subscribed_at",
      label: "Subscribed",
      sortable: true,
      width: "130px",
      render: (r) => (
        <span className="font-mono text-xs text-text-muted">
          {formatDate(r.subscribed_at)}
        </span>
      ),
    },
  ];

  const filtered = useMemo(() => {
    let rows = subscribers;
    if (filter !== "all") rows = rows.filter((r) => r.status === filter);
    if (search.trim()) {
      const q = search.toLowerCase();
      rows = rows.filter(
        (r) =>
          r.email.toLowerCase().includes(q) ||
          (r.name ?? "").toLowerCase().includes(q) ||
          (r.source ?? "").toLowerCase().includes(q)
      );
    }
    return rows;
  }, [subscribers, filter, search]);

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-text-primary">
            Newsletter
          </h1>
          <p className="text-text-secondary text-sm mt-1">
            Manage subscribers and view list health.
          </p>
        </div>
        <button
          onClick={() => exportCsv(filtered)}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border border-border text-text-secondary text-xs font-semibold hover:bg-white/5 transition-colors"
        >
          <Download className="w-3.5 h-3.5" />
          Export CSV
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total Subscribers", value: stats.total, icon: Users, color: "text-accent-primary", bg: "bg-accent-primary/10" },
          { label: "Active", value: stats.active, icon: UserCheck, color: "text-emerald-400", bg: "bg-emerald-500/10" },
          { label: "Unsub This Month", value: stats.unsubscribed_this_month, icon: UserMinus, color: "text-rose-400", bg: "bg-rose-500/10" },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div
            key={label}
            className="rounded-xl border border-border bg-bg-card p-5 flex items-center gap-4"
          >
            <div className={cn("p-2.5 rounded-xl", bg)}>
              <Icon className={cn("w-4 h-4", color)} />
            </div>
            <div>
              <p className="font-mono text-xs text-text-muted">{label}</p>
              <p className="font-display text-2xl font-bold text-text-primary">
                {value.toLocaleString()}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters + search */}
      <div className="flex items-center gap-4">
        <div className="flex gap-1 p-1 bg-bg-secondary rounded-xl border border-border">
          {FILTER_TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setFilter(t.key)}
              className={cn(
                "px-3 py-1 rounded-lg text-xs font-mono transition-all",
                filter === t.key
                  ? "bg-accent-primary/10 text-accent-primary border border-accent-primary/20"
                  : "text-text-muted hover:text-text-secondary"
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted pointer-events-none" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search subscribers…"
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-bg-secondary border border-border text-text-primary placeholder:text-text-muted text-sm outline-none focus:border-accent-primary/50 transition-colors"
          />
        </div>

        <span className="font-mono text-xs text-text-muted ml-auto">
          {filtered.length.toLocaleString()} result{filtered.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={filtered}
        rowKey={(r) => r.id}
        emptyMessage="No subscribers match your filter."
      />
    </div>
  );
}
