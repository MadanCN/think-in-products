"use client";

import { useEffect, useRef, useState } from "react";
import { MAX_FEATURED, SECTIONS, type Piece } from "@/lib/types";

export function Modal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    ref.current?.querySelector<HTMLElement>("button, input, a")?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <div className="modal-back" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" role="dialog" aria-modal="true" aria-label={title} ref={ref}>
        <h2>{title}</h2>
        {children}
      </div>
    </div>
  );
}

export function ConfirmDialog({ title, body, confirmLabel, danger, onConfirm, onClose }: { title: string; body: React.ReactNode; confirmLabel: string; danger?: boolean; onConfirm: () => Promise<void> | void; onClose: () => void }) {
  const [busy, setBusy] = useState(false);
  return (
    <Modal title={title} onClose={onClose}>
      <div style={{ margin: "8px 0 22px", lineHeight: 1.55 }}>{body}</div>
      <div className="row" style={{ justifyContent: "flex-end" }}>
        <button type="button" className="btn btn-sm" onClick={onClose}>Cancel</button>
        <button
          type="button"
          className={`btn btn-sm ${danger ? "btn-red" : "btn-dark"}`}
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            await onConfirm();
            setBusy(false);
          }}
        >
          {busy ? "Working..." : confirmLabel}
        </button>
      </div>
    </Modal>
  );
}

// Shown when someone tries to feature a piece but the limit is reached.
export function FeatureLimitDialog({ featured, target, onUnfeature, onClose }: { featured: Piece[]; target: Piece; onUnfeature: (p: Piece) => Promise<void>; onClose: () => void }) {
  const [busy, setBusy] = useState<string | null>(null);
  const s = SECTIONS[target.type];
  return (
    <Modal title={`${s.plural} already has ${MAX_FEATURED} featured`} onClose={onClose}>
      <p style={{ margin: "6px 0 16px" }}>
        Remove one from featured to make room for <strong>{target.title || "this piece"}</strong>. It will be featured as soon as there&apos;s room.
      </p>
      <ul className="feat-list">
        {featured.map((p) => (
          <li key={p.id}>
            <span>
              <strong>{p.title}</strong>
              <span className="small" style={{ display: "block" }}>{p.category || s.label}</span>
            </span>
            <button
              type="button"
              className="btn btn-sm"
              disabled={busy !== null}
              onClick={async () => {
                setBusy(p.id);
                await onUnfeature(p);
                setBusy(null);
              }}
            >
              {busy === p.id ? "Removing..." : "Remove from featured"}
            </button>
          </li>
        ))}
      </ul>
      <div className="row" style={{ justifyContent: "flex-end", marginTop: 16 }}>
        <button type="button" className="btn btn-sm" onClick={onClose}>Cancel</button>
      </div>
    </Modal>
  );
}
