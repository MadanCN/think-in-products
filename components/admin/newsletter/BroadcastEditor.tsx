"use client";

import { useState, useRef, useCallback } from "react";
import dynamic from "next/dynamic";
import {
  Plus,
  Loader2,
  CheckCheck,
  Send,
  FlaskConical,
  Trash2,
  CheckCircle2,
  Circle,
  X,
  Copy,
  RefreshCw,
} from "lucide-react";
import {
  createBroadcast,
  updateBroadcast,
  deleteBroadcast,
} from "@/app/actions/newsletter";
import type { AdminBroadcastWithStats, BroadcastEventStats } from "@/app/actions/newsletter";
import { mdToHtml } from "@/lib/mdToHtml";
import { useToast, ToastContainer } from "@/components/admin/Toast";
import { cn } from "@/lib/utils";
import "@uiw/react-md-editor/markdown-editor.css";

const MDEditor = dynamic(() => import("@uiw/react-md-editor"), { ssr: false });

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function EmailPreview({
  subject,
  previewText,
  bodyHtml,
}: {
  subject: string;
  previewText: string;
  bodyHtml: string;
}) {
  return (
    <div className="h-full overflow-y-auto bg-[#F1F5F9] p-4">
      <div className="max-w-[600px] mx-auto">
        {/* Simulated email client header */}
        <div className="mb-3 pb-3 border-b border-[#E2E8F0]">
          <p className="text-xs text-[#64748B] font-mono">From: hello@thinkinproducts.com</p>
          <p className="text-sm text-[#1E293B] font-semibold mt-1">
            {subject || <span className="text-[#94A3B8] italic font-normal">No subject yet…</span>}
          </p>
          {previewText && (
            <p className="text-xs text-[#94A3B8] mt-0.5 italic">{previewText}</p>
          )}
        </div>

        {/* Email body */}
        <div className="rounded-xl border border-[#E2E8F0] bg-white overflow-hidden shadow-sm">
          {/* Header bar */}
          <div className="px-10 py-5 border-b border-[#E2E8F0] bg-white">
            <p className="text-xs font-bold tracking-widest text-[#00A896] font-mono uppercase">
              Think in Products
            </p>
          </div>

          {/* Body */}
          <div
            className="px-10 py-9 text-[#1E293B] text-sm leading-relaxed"
            dangerouslySetInnerHTML={{
              __html: bodyHtml || '<p style="color:#94A3B8;font-style:italic;margin:0">Start writing your email…</p>',
            }}
          />

          {/* Footer */}
          <div className="px-10 pb-7 pt-5 border-t border-[#E2E8F0] bg-[#F8FAFC]">
            <p className="text-xs text-[#94A3B8] leading-relaxed">
              You&apos;re receiving this because you subscribed to Think in Products.
            </p>
            <p className="text-xs mt-1.5">
              <span className="text-[#94A3B8] underline cursor-default">Unsubscribe</span>
              <span className="text-[#CBD5E1] mx-2">|</span>
              <span className="text-[#94A3B8] underline cursor-default">Visit site</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatPill({
  label,
  value,
  sub,
  rose,
}: {
  label: string;
  value: string;
  sub?: string;
  rose?: boolean;
}) {
  return (
    <div className="flex flex-col">
      <span className="font-mono text-[10px] uppercase tracking-wider text-text-muted">{label}</span>
      <span className={cn("font-display text-lg font-bold leading-none mt-0.5", rose ? "text-rose-400" : "text-text-primary")}>
        {value}
      </span>
      {sub && <span className="font-mono text-[10px] text-text-muted mt-0.5">{sub}</span>}
    </div>
  );
}

function StatsPanel({
  stats,
  recipientCount,
}: {
  stats: BroadcastEventStats;
  recipientCount: number;
}) {
  const hasAny = stats.delivered + stats.bounced + stats.opened + stats.clicked + stats.complained > 0;
  const deliveryRate = recipientCount > 0 ? Math.round((stats.delivered / recipientCount) * 100) : 0;
  const openRate = stats.delivered > 0 ? Math.round((stats.opened / stats.delivered) * 100) : 0;
  const clickRate = stats.opened > 0 ? Math.round((stats.clicked / stats.opened) * 100) : 0;

  return (
    <div className="shrink-0 border-b border-border bg-bg-secondary/20 px-6 py-3">
      <div className="flex items-center justify-between mb-3">
        <p className="font-mono text-[10px] uppercase tracking-wider text-text-muted">Delivery Analytics</p>
        {!hasAny && (
          <span className="font-mono text-[10px] text-text-muted italic">
            Waiting for webhook events — check Resend dashboard for setup
          </span>
        )}
      </div>
      <div className="grid grid-cols-5 gap-5">
        <StatPill
          label="Sent"
          value={recipientCount.toLocaleString()}
        />
        <StatPill
          label="Delivered"
          value={stats.delivered.toLocaleString()}
          sub={recipientCount > 0 ? `${deliveryRate}% delivery` : undefined}
        />
        <StatPill
          label="Opened"
          value={stats.opened.toLocaleString()}
          sub={stats.delivered > 0 ? `${openRate}% open rate` : undefined}
        />
        <StatPill
          label="Clicked"
          value={stats.clicked.toLocaleString()}
          sub={stats.opened > 0 ? `${clickRate}% CTR` : undefined}
        />
        <StatPill
          label="Bounced"
          value={stats.bounced.toLocaleString()}
          rose={stats.bounced > 0}
          sub={stats.complained > 0 ? `${stats.complained} complaint${stats.complained > 1 ? "s" : ""}` : undefined}
        />
      </div>
    </div>
  );
}

interface ChecklistItem {
  label: string;
  pass: boolean;
}

function Checklist({ items }: { items: ChecklistItem[] }) {
  return (
    <div className="flex flex-wrap gap-x-6 gap-y-2">
      {items.map((item) => (
        <div key={item.label} className="flex items-center gap-1.5">
          {item.pass ? (
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          ) : (
            <Circle className="w-3.5 h-3.5 text-text-muted shrink-0" />
          )}
          <span
            className={cn(
              "text-xs font-mono",
              item.pass ? "text-text-secondary" : "text-text-muted"
            )}
          >
            {item.label}
          </span>
        </div>
      ))}
    </div>
  );
}

interface Props {
  broadcasts: AdminBroadcastWithStats[];
  activeCount: number;
}

type ConfirmMode = "send" | "resend" | null;

export function BroadcastEditor({ broadcasts: initialBroadcasts, activeCount }: Props) {
  const [broadcasts, setBroadcasts] = useState(initialBroadcasts);
  const [selected, setSelected] = useState<AdminBroadcastWithStats | null>(
    initialBroadcasts.find((b) => b.status === "draft") ?? null
  );

  const [subject, setSubject] = useState(selected?.subject ?? "");
  const [previewText, setPreviewText] = useState(selected?.preview_text ?? "");
  const [content, setContent] = useState(selected?.content ?? "");

  const [saveState, setSaveState] = useState<"saved" | "saving" | "modified">(
    selected ? "saved" : "modified"
  );
  const [sendingTest, setSendingTest] = useState(false);
  const [sendingAll, setSendingAll] = useState(false);
  const [duplicating, setDuplicating] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [confirmMode, setConfirmMode] = useState<ConfirmMode>(null);

  const { toasts, toast, dismiss } = useToast();
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const selectedRef = useRef(selected);
  selectedRef.current = selected;

  const formRef = useRef({ subject, previewText, content });
  formRef.current = { subject, previewText, content };

  const bodyHtml = mdToHtml(content);

  const checklist: ChecklistItem[] = [
    { label: "Subject set", pass: subject.trim().length > 0 },
    { label: "Content written", pass: content.trim().length > 0 },
    { label: "Preview text", pass: previewText.trim().length > 0 },
    { label: "Saved as draft", pass: saveState === "saved" },
  ];
  const canSend = checklist.every((c) => c.pass) && selected?.status === "draft";

  const scheduleSave = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      const f = formRef.current;
      const cur = selectedRef.current;
      if (!cur || cur.status === "sent") return;
      setSaveState("saving");
      try {
        const raw = await updateBroadcast(cur.id, {
          subject: f.subject,
          preview_text: f.previewText,
          content: f.content,
        });
        const updated: AdminBroadcastWithStats = { ...raw, stats: cur.stats };
        setSelected(updated);
        setBroadcasts((prev) => prev.map((b) => (b.id === updated.id ? updated : b)));
        setSaveState("saved");
      } catch {
        setSaveState("modified");
      }
    }, 2000);
  }, []);

  function handleFieldChange(setter: (v: string) => void, value: string) {
    setter(value);
    setSaveState("modified");
    scheduleSave();
  }

  async function handleNewBroadcast() {
    setSaveState("saving");
    try {
      const raw = await createBroadcast({ subject: "Untitled Broadcast" });
      const b: AdminBroadcastWithStats = { ...raw, stats: { delivered: 0, bounced: 0, opened: 0, clicked: 0, complained: 0 } };
      setBroadcasts((prev) => [b, ...prev]);
      setSelected(b);
      setSubject(b.subject);
      setPreviewText(b.preview_text ?? "");
      setContent(b.content ?? "");
      setSaveState("saved");
    } catch {
      toast({ message: "Failed to create broadcast", type: "error" });
      setSaveState("modified");
    }
  }

  async function handleDuplicate() {
    if (!selected) return;
    setDuplicating(true);
    try {
      const raw = await createBroadcast({
        subject: `${subject} (Copy)`,
        preview_text: previewText,
        content,
      });
      const b: AdminBroadcastWithStats = { ...raw, stats: { delivered: 0, bounced: 0, opened: 0, clicked: 0, complained: 0 } };
      setBroadcasts((prev) => [b, ...prev]);
      setSelected(b);
      setSubject(b.subject);
      setPreviewText(b.preview_text ?? "");
      setContent(b.content ?? "");
      setSaveState("saved");
      toast({ message: "Duplicated as new draft — ready to edit and send" });
    } catch {
      toast({ message: "Duplicate failed", type: "error" });
    } finally {
      setDuplicating(false);
    }
  }

  function selectBroadcast(b: AdminBroadcastWithStats) {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setSelected(b);
    setSubject(b.subject);
    setPreviewText(b.preview_text ?? "");
    setContent(b.content ?? "");
    setSaveState("saved");
  }

  async function handleSaveNow() {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!selected) return;
    setSaveState("saving");
    try {
      const raw = await updateBroadcast(selected.id, {
        subject,
        preview_text: previewText,
        content,
      });
      const updated: AdminBroadcastWithStats = { ...raw, stats: selected.stats };
      setSelected(updated);
      setBroadcasts((prev) => prev.map((b) => (b.id === updated.id ? updated : b)));
      setSaveState("saved");
    } catch {
      toast({ message: "Save failed", type: "error" });
      setSaveState("modified");
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this draft?")) return;
    try {
      await deleteBroadcast(id);
      setBroadcasts((prev) => prev.filter((b) => b.id !== id));
      if (selected?.id === id) {
        const next = broadcasts.find((b) => b.id !== id) ?? null;
        setSelected(next);
        setSubject(next?.subject ?? "");
        setPreviewText(next?.preview_text ?? "");
        setContent(next?.content ?? "");
        setSaveState(next ? "saved" : "modified");
      }
      toast({ message: "Draft deleted" });
    } catch {
      toast({ message: "Delete failed", type: "error" });
    }
  }

  async function handleSendTest() {
    if (!selected) return;
    setSendingTest(true);
    try {
      const res = await fetch("/api/admin/broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ broadcastId: selected.id, test: true }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      toast({ message: "Test email sent to your inbox" });
    } catch (e) {
      toast({ message: `Test failed: ${(e as Error).message}`, type: "error" });
    } finally {
      setSendingTest(false);
    }
  }

  async function handleSendAll() {
    if (!selected || confirmText !== "SEND") return;
    setConfirmMode(null);
    setConfirmText("");
    setSendingAll(true);
    try {
      const res = await fetch("/api/admin/broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ broadcastId: selected.id }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      toast({ message: `Sent to ${json.sent.toLocaleString()} subscribers`, type: "success" });
      const updatedBroadcast: AdminBroadcastWithStats = {
        ...selected,
        status: "sent" as const,
        recipient_count: json.sent,
        sent_at: new Date().toISOString(),
        stats: { delivered: 0, bounced: 0, opened: 0, clicked: 0, complained: 0 },
      };
      setSelected(updatedBroadcast);
      setBroadcasts((prev) => prev.map((b) => (b.id === selected.id ? updatedBroadcast : b)));
    } catch (e) {
      toast({ message: `Send failed: ${(e as Error).message}`, type: "error" });
    } finally {
      setSendingAll(false);
    }
  }

  async function handleResendAll() {
    if (!selected || confirmText !== "SEND") return;
    setConfirmMode(null);
    setConfirmText("");
    setSendingAll(true);
    try {
      const res = await fetch("/api/admin/broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ broadcastId: selected.id }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      toast({ message: `Resent to ${json.sent.toLocaleString()} subscribers`, type: "success" });
    } catch (e) {
      toast({ message: `Resend failed: ${(e as Error).message}`, type: "error" });
    } finally {
      setSendingAll(false);
    }
  }

  const isSent = selected?.status === "sent";

  return (
    <>
      <div className="flex flex-col -m-8 h-[calc(100vh-3.5rem)] overflow-hidden">
        {/* Header */}
        <div className="h-14 shrink-0 border-b border-border px-5 flex items-center gap-4 bg-bg-primary/60 backdrop-blur-sm">
          <p className="font-display font-semibold text-sm text-text-primary shrink-0">
            Broadcast
          </p>

          <div className="flex-1 min-w-0">
            {selected && (
              <p className="font-mono text-xs text-text-muted truncate">
                {isSent
                  ? `Sent ${selected.sent_at ? formatDate(selected.sent_at) : ""} · ${selected.recipient_count ?? 0} recipients`
                  : "Draft"}
              </p>
            )}
          </div>

          {/* Save state */}
          {!isSent && (
            <div className="shrink-0 flex items-center gap-1.5">
              {saveState === "saving" && (
                <span className="flex items-center gap-1.5 font-mono text-xs text-text-muted">
                  <Loader2 className="w-3 h-3 animate-spin" /> Saving…
                </span>
              )}
              {saveState === "saved" && (
                <span className="flex items-center gap-1.5 font-mono text-xs text-emerald-400">
                  <CheckCheck className="w-3.5 h-3.5" /> Saved
                </span>
              )}
              {saveState === "modified" && (
                <span className="font-mono text-xs text-text-muted">Unsaved</span>
              )}
            </div>
          )}

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleNewBroadcast}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-text-secondary text-xs font-semibold hover:bg-white/5 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              New
            </button>

            {/* Draft actions */}
            {selected && !isSent && (
              <>
                <button
                  onClick={handleSaveNow}
                  disabled={saveState === "saving"}
                  className="px-3 py-1.5 rounded-lg border border-border text-text-secondary text-xs font-semibold hover:bg-white/5 transition-colors disabled:opacity-50"
                >
                  Save Draft
                </button>
                <button
                  onClick={handleSendTest}
                  disabled={sendingTest || !subject.trim()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-text-secondary text-xs font-semibold hover:bg-white/5 transition-colors disabled:opacity-50"
                >
                  {sendingTest ? <Loader2 className="w-3 h-3 animate-spin" /> : <FlaskConical className="w-3.5 h-3.5" />}
                  Test
                </button>
                <button
                  onClick={() => setConfirmMode("send")}
                  disabled={!canSend || sendingAll}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-accent-primary text-bg-primary text-xs font-semibold hover:bg-accent-primary/90 transition-colors disabled:opacity-50"
                >
                  {sendingAll ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                  Send to {activeCount.toLocaleString()}
                </button>
              </>
            )}

            {/* Sent broadcast actions */}
            {selected && isSent && (
              <>
                <button
                  onClick={handleDuplicate}
                  disabled={duplicating}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-text-secondary text-xs font-semibold hover:bg-white/5 transition-colors disabled:opacity-50"
                >
                  {duplicating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Copy className="w-3.5 h-3.5" />}
                  Duplicate
                </button>
                <button
                  onClick={() => setConfirmMode("resend")}
                  disabled={sendingAll}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-accent-secondary/80 text-bg-primary text-xs font-semibold hover:bg-accent-secondary transition-colors disabled:opacity-50"
                >
                  {sendingAll ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                  Resend
                </button>
              </>
            )}
          </div>
        </div>

        {/* Body */}
        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar: broadcast list */}
          <div className="w-56 shrink-0 border-r border-border bg-bg-secondary/20 overflow-y-auto flex flex-col">
            <p className="font-mono text-xs text-text-muted uppercase tracking-wider px-4 pt-4 pb-2">
              Drafts &amp; History
            </p>
            {broadcasts.length === 0 ? (
              <p className="px-4 py-3 font-mono text-xs text-text-muted italic">
                No broadcasts yet.
              </p>
            ) : (
              broadcasts.map((b) => (
                <button
                  key={b.id}
                  onClick={() => selectBroadcast(b)}
                  className={cn(
                    "w-full text-left px-4 py-3 border-b border-border/50 hover:bg-white/[0.02] transition-colors group",
                    selected?.id === b.id && "bg-accent-primary/5 border-l-2 border-l-accent-primary pl-3.5"
                  )}
                >
                  <p className="text-xs font-medium text-text-primary truncate">
                    {b.subject}
                  </p>
                  <div className="flex items-center justify-between mt-0.5">
                    <span
                      className={cn(
                        "font-mono text-[10px]",
                        b.status === "sent" ? "text-emerald-400" : "text-text-muted"
                      )}
                    >
                      {b.status}
                    </span>
                    {/* Only drafts can be deleted */}
                    {b.status === "draft" && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(b.id);
                        }}
                        className="opacity-0 group-hover:opacity-60 hover:!opacity-100 text-rose-400 transition-opacity"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                  {b.status === "sent" && b.sent_at && (
                    <p className="font-mono text-[10px] text-text-muted mt-0.5">
                      {formatDate(b.sent_at)}
                    </p>
                  )}
                  {b.status === "sent" && (
                    <p className="font-mono text-[10px] text-text-muted">
                      {b.recipient_count ?? 0} sent
                      {b.stats.delivered > 0 && ` · ${b.stats.delivered} delivered`}
                      {b.stats.opened > 0 && ` · ${b.stats.opened} opens`}
                    </p>
                  )}
                </button>
              ))
            )}
          </div>

          {/* Main: compose / view */}
          {selected ? (
            <div className="flex flex-1 overflow-hidden flex-col">
              {/* Sent notice banner */}
              {isSent && (
                <div className="shrink-0 px-6 py-2 bg-emerald-500/10 border-b border-emerald-500/20 flex items-center justify-between">
                  <p className="text-xs text-emerald-400 font-mono">
                    Sent {selected.sent_at ? formatDate(selected.sent_at) : ""} · {selected.recipient_count ?? 0} recipients · Read-only
                  </p>
                  <p className="text-xs text-emerald-400/70 font-mono">
                    Duplicate to edit, or Resend to re-send
                  </p>
                </div>
              )}

              {/* Analytics panel for sent broadcasts */}
              {isSent && selected.stats && (
                <StatsPanel
                  stats={selected.stats}
                  recipientCount={selected.recipient_count ?? 0}
                />
              )}

              {/* Subject + preview_text */}
              <div className="shrink-0 border-b border-border px-6 py-4 space-y-3 bg-bg-primary/40">
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => !isSent && handleFieldChange(setSubject, e.target.value)}
                  readOnly={isSent}
                  placeholder="Subject line…"
                  className={cn(
                    "w-full px-4 py-2.5 rounded-xl bg-bg-secondary border border-border text-text-primary placeholder:text-text-muted font-display font-semibold text-base outline-none transition-colors",
                    isSent ? "cursor-default select-text opacity-70" : "focus:border-accent-primary/50"
                  )}
                />
                <input
                  type="text"
                  value={previewText}
                  onChange={(e) => !isSent && handleFieldChange(setPreviewText, e.target.value)}
                  readOnly={isSent}
                  placeholder="Preview text (shown in inbox preview)…"
                  className={cn(
                    "w-full px-4 py-2.5 rounded-xl bg-bg-secondary border border-border text-text-secondary placeholder:text-text-muted text-sm outline-none transition-colors",
                    isSent ? "cursor-default select-text opacity-70" : "focus:border-accent-primary/50"
                  )}
                />
              </div>

              {/* Split pane */}
              <div className="flex flex-1 overflow-hidden">
                {/* Editor or read-only view */}
                <div
                  className="flex-1 overflow-hidden border-r border-border"
                  data-color-mode="dark"
                >
                  {isSent ? (
                    <div
                      className="h-full overflow-y-auto p-6 prose prose-invert max-w-none"
                      dangerouslySetInnerHTML={{ __html: bodyHtml }}
                    />
                  ) : (
                    <MDEditor
                      value={content}
                      onChange={(v) => handleFieldChange(setContent, v ?? "")}
                      preview="live"
                      height="100%"
                      style={{ borderRadius: 0, border: "none", height: "100%" }}
                    />
                  )}
                </div>

                {/* Email preview — matches the actual sent email template */}
                <div className="flex-1 overflow-hidden flex flex-col">
                  <div className="shrink-0 px-4 py-2 border-b border-border bg-bg-secondary/30">
                    <p className="font-mono text-xs text-text-muted uppercase tracking-wider">
                      Email Preview
                    </p>
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <EmailPreview
                      subject={subject}
                      previewText={previewText}
                      bodyHtml={bodyHtml}
                    />
                  </div>
                </div>
              </div>

              {/* Pre-send checklist */}
              {!isSent && (
                <div className="shrink-0 border-t border-border px-6 py-3 bg-bg-secondary/20">
                  <Checklist items={checklist} />
                </div>
              )}
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center">
              <div className="p-4 rounded-2xl bg-accent-primary/10 border border-accent-primary/20">
                <Send className="w-6 h-6 text-accent-primary" />
              </div>
              <p className="font-display font-semibold text-text-primary">
                No broadcast selected
              </p>
              <p className="text-text-muted text-sm max-w-xs">
                Select a broadcast from the list or create a new one.
              </p>
              <button
                onClick={handleNewBroadcast}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-accent-primary text-bg-primary text-sm font-semibold hover:bg-accent-primary/90 transition-colors"
              >
                <Plus className="w-4 h-4" />
                New Broadcast
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Confirm modal — shared for send + resend */}
      {confirmMode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-bg-card border border-border rounded-2xl p-8 w-full max-w-sm shadow-2xl">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="font-display font-bold text-text-primary text-lg">
                  {confirmMode === "resend" ? "Resend to everyone?" : "Send to everyone?"}
                </p>
                <p className="text-text-muted text-sm mt-1">
                  {confirmMode === "resend"
                    ? "This will resend the exact same email to "
                    : "This will send to "}
                  <strong className="text-text-primary">{activeCount.toLocaleString()}</strong>{" "}
                  active subscribers. This cannot be undone.
                </p>
              </div>
              <button
                onClick={() => { setConfirmMode(null); setConfirmText(""); }}
                className="p-1 text-text-muted hover:text-text-primary transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="font-mono text-xs text-text-muted mb-2">
              Type <strong className="text-text-primary">SEND</strong> to confirm
            </p>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && confirmText === "SEND") {
                  if (confirmMode === "resend") { handleResendAll(); } else { handleSendAll(); }
                }
              }}
              placeholder="SEND"
              autoFocus
              className="w-full px-4 py-2.5 rounded-xl bg-bg-secondary border border-border text-text-primary font-mono text-sm outline-none focus:border-rose-500/50 transition-colors mb-4"
            />

            <div className="flex gap-2">
              <button
                onClick={() => { setConfirmMode(null); setConfirmText(""); }}
                className="flex-1 py-2 rounded-xl border border-border text-text-secondary text-sm font-semibold hover:bg-white/5 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmMode === "resend" ? handleResendAll : handleSendAll}
                disabled={confirmText !== "SEND"}
                className="flex-1 py-2 rounded-xl bg-rose-500 text-white text-sm font-semibold hover:bg-rose-500/90 transition-colors disabled:opacity-40"
              >
                {confirmMode === "resend" ? "Resend Now" : "Send Now"}
              </button>
            </div>
          </div>
        </div>
      )}

      <ToastContainer toasts={toasts} dismiss={dismiss} />
    </>
  );
}
