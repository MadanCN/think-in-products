"use client";

import type { Piece, PieceType } from "@/lib/types";

// The admin always talks to the server. The server decides where pieces live
// (Supabase, or .data/pieces.json in local mode).

export const draftKey = (id: string) => `tip:draft:${id}`;

export class FeatureLimit extends Error {
  constructor(message: string, public featured: Piece[]) {
    super(message);
  }
}

async function call<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, { cache: "no-store", ...init });
  const data = await res.json().catch(() => ({}));
  if (res.status === 409 && data.featured) throw new FeatureLimit(data.error, data.featured);
  if (!res.ok) throw new Error(data.error ?? "Something went wrong");
  return data as T;
}

export async function listPieces(params: { type?: PieceType; q?: string; status?: string } = {}): Promise<Piece[]> {
  const qs = new URLSearchParams(Object.entries(params).filter(([, v]) => v) as [string, string][]).toString();
  return (await call<{ pieces: Piece[] }>(`/api/admin/pieces${qs ? `?${qs}` : ""}`)).pieces;
}

export async function loadPiece(id: string): Promise<Piece | null> {
  try {
    return (await call<{ piece: Piece }>(`/api/admin/pieces/${encodeURIComponent(id)}`)).piece;
  } catch {
    return null;
  }
}

export async function savePiece(piece: Piece): Promise<Piece> {
  return (await call<{ piece: Piece }>("/api/admin/pieces", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(piece) })).piece;
}

export async function deletePiece(id: string): Promise<void> {
  await call(`/api/admin/pieces/${encodeURIComponent(id)}`, { method: "DELETE" });
}

export async function importSamples(): Promise<number> {
  return (await call<{ imported: number }>("/api/admin/pieces", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ importSamples: true }) })).imported;
}

export async function uploadImage(file: File): Promise<string> {
  const form = new FormData();
  form.append("file", file);
  return (await call<{ url: string }>("/api/admin/upload", { method: "POST", body: form })).url;
}

export type Metrics = {
  local: boolean;
  inbox: { contact: number; pitch: number };
  comments: { unseen: number; week: number };
  activeReaders7: number;
  days: string[];
  views: { total30: number; byDay: number[] };
  content: Record<PieceType, { published: number; drafts: number; featured: number; views30: number }>;
  topPieces: { id: string; title: string; type: PieceType; views: number }[];
  pieceViews: Record<string, number>;
  subscribers: { active: number; pending: number; unsubscribed: number; new30: number; byDay: number[] };
  accounts: { total: number; plus: number; pro: number };
  newsletter: {
    sends: { id: string; pieceId: string; title: string; audience: string; status: string; sentAt: string; recipients: number; delivered: number; opened: number; clicked: number; bounced: number; openRate: number; clickRate: number }[];
    avgOpenRate: number | null;
    avgClickRate: number | null;
  };
};

export async function loadMetrics(): Promise<Metrics> {
  return call<Metrics>("/api/admin/metrics");
}
