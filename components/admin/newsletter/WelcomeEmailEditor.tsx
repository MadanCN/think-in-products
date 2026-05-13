"use client";

import { useState, useRef, useCallback } from "react";
import dynamic from "next/dynamic";
import { CheckCheck, Loader2, Info } from "lucide-react";
import { updateWelcomeTemplate } from "@/app/actions/newsletter";
import type { WelcomeTemplate } from "@/app/actions/newsletter";
import { mdToHtml } from "@/lib/mdToHtml";
import { useToast, ToastContainer } from "@/components/admin/Toast";
import "@uiw/react-md-editor/markdown-editor.css";

const MDEditor = dynamic(() => import("@uiw/react-md-editor"), { ssr: false });

interface Props {
  initial: WelcomeTemplate;
}

export function WelcomeEmailEditor({ initial }: Props) {
  const [subject, setSubject] = useState(initial.subject);
  const [content, setContent] = useState(initial.content);
  const [saveState, setSaveState] = useState<"saved" | "saving" | "modified">("saved");
  const { toasts, toast, dismiss } = useToast();
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  const subjectRef = useRef(subject);
  const contentRef = useRef(content);
  subjectRef.current = subject;
  contentRef.current = content;

  const bodyHtml = mdToHtml(content);

  const scheduleSave = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setSaveState("saving");
      try {
        await updateWelcomeTemplate({
          subject: subjectRef.current,
          content: contentRef.current,
        });
        setSaveState("saved");
      } catch {
        setSaveState("modified");
        toast({ message: "Failed to save template", type: "error" });
      }
    }, 2000);
  }, [toast]);

  function handleChange(setter: (v: string) => void, value: string) {
    setter(value);
    setSaveState("modified");
    scheduleSave();
  }

  async function handleSaveNow() {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setSaveState("saving");
    try {
      await updateWelcomeTemplate({ subject, content });
      setSaveState("saved");
      toast({ message: "Welcome email saved" });
    } catch {
      setSaveState("modified");
      toast({ message: "Save failed", type: "error" });
    }
  }

  return (
    <>
      <div className="flex flex-col -m-8 h-[calc(100vh-3.5rem)] overflow-hidden">
        {/* Header */}
        <div className="h-14 shrink-0 border-b border-border px-5 flex items-center gap-4 bg-bg-primary/60 backdrop-blur-sm">
          <p className="font-display font-semibold text-sm text-text-primary shrink-0">
            Welcome Email Template
          </p>
          <div className="flex-1" />

          {/* Save state */}
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

          <button
            onClick={handleSaveNow}
            disabled={saveState === "saving"}
            className="px-3.5 py-1.5 rounded-lg bg-accent-primary text-bg-primary text-xs font-semibold hover:bg-accent-primary/90 transition-colors disabled:opacity-50"
          >
            Save
          </button>
        </div>

        {/* Notice */}
        <div className="shrink-0 px-6 py-2.5 bg-accent-secondary/10 border-b border-accent-secondary/20 flex items-start gap-2">
          <Info className="w-3.5 h-3.5 text-accent-secondary shrink-0 mt-0.5" />
          <p className="font-mono text-xs text-text-secondary">
            Sent automatically on subscribe. Use <code className="px-1 py-0.5 rounded bg-white/10 text-accent-primary">{"{{name}}"}</code> anywhere to insert the subscriber&apos;s first name.
          </p>
        </div>

        {/* Subject */}
        <div className="shrink-0 border-b border-border px-6 py-4 bg-bg-primary/40">
          <input
            type="text"
            value={subject}
            onChange={(e) => handleChange(setSubject, e.target.value)}
            placeholder="Subject line…"
            className="w-full px-4 py-2.5 rounded-xl bg-bg-secondary border border-border text-text-primary placeholder:text-text-muted font-display font-semibold text-base outline-none focus:border-accent-primary/50 transition-colors"
          />
        </div>

        {/* Split pane */}
        <div className="flex flex-1 overflow-hidden">
          {/* Editor */}
          <div className="flex-1 overflow-hidden border-r border-border" data-color-mode="dark">
            <MDEditor
              value={content}
              onChange={(v) => handleChange(setContent, v ?? "")}
              preview="live"
              height="100%"
              style={{ borderRadius: 0, border: "none", height: "100%" }}
            />
          </div>

          {/* Email preview */}
          <div className="flex-1 overflow-hidden flex flex-col">
            <div className="shrink-0 px-4 py-2 border-b border-border bg-bg-secondary/30">
              <p className="font-mono text-xs text-text-muted uppercase tracking-wider">
                Email Preview
              </p>
            </div>
            <div className="flex-1 overflow-y-auto bg-[#F1F5F9] p-4">
              <div className="max-w-[600px] mx-auto">
                <div className="mb-3 pb-3 border-b border-[#E2E8F0]">
                  <p className="text-xs text-[#94A3B8] font-mono">From: Think in Products &lt;hello@thinkinproducts.com&gt;</p>
                  <p className="text-sm text-[#1E293B] font-semibold mt-1">{subject || "No subject yet…"}</p>
                </div>
                <div className="rounded-xl border border-[#E2E8F0] bg-white overflow-hidden">
                  {/* Header */}
                  <div className="px-10 py-5 border-b border-[#E2E8F0] flex items-center gap-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="https://i.postimg.cc/8zMFDKGG/logo.png" alt="" width="28" height="28" className="object-contain" />
                    <p className="text-xs font-bold tracking-widest text-[#00A896] font-mono uppercase">Think in Products</p>
                  </div>
                  {/* Body */}
                  <div className="px-10 py-9 text-[#1E293B] text-sm leading-relaxed">
                    <p style={{ fontWeight: 600, marginBottom: "16px", color: "#1E293B" }}>
                      Hey [subscriber],
                    </p>
                    <div
                      className="prose-preview"
                      dangerouslySetInnerHTML={{ __html: bodyHtml || '<p style="color:#94A3B8;font-style:italic;margin:0">Start writing…</p>' }}
                    />
                  </div>
                  {/* Footer */}
                  <div className="px-10 pb-7 pt-5 border-t border-[#E2E8F0] bg-[#F8FAFC]">
                    <p className="text-xs text-[#94A3B8]">You&apos;re receiving this because you subscribed to Think in Products.</p>
                    <p className="text-xs mt-1.5"><span className="text-[#94A3B8] underline cursor-default">Unsubscribe</span></p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <ToastContainer toasts={toasts} dismiss={dismiss} />
    </>
  );
}
