import "server-only";
import { cache } from "react";
import { getPublishedBySlug, listPieces } from "./repo";
import type { Access, Piece, PieceType } from "./types";

// Public, published-only reads used by the website.
export const getPublished = cache(async (type?: PieceType): Promise<Piece[]> => listPieces({ type, status: "published" }));

export const getPublishedPiece = cache(async (type: PieceType, slug: string) => getPublishedBySlug(type, slug));

export async function getFeatured(type: PieceType): Promise<Piece[]> {
  return (await getPublished(type)).filter((p) => p.featured);
}

export async function getRelated(piece: Piece, count = 3): Promise<Piece[]> {
  const all = (await getPublished()).filter((p) => p.id !== piece.id && p.type !== "newsletter");
  const score = (p: Piece) => (p.type === piece.type ? 2 : 0) + (p.category && p.category === piece.category ? 3 : 0) + p.tags.filter((t) => piece.tags.includes(t)).length;
  return all.sort((a, b) => score(b) - score(a)).slice(0, count);
}

const RANK: Record<Access, number> = { free: 0, plus: 1, pro: 2 };
export function canRead(pieceAccess: Access, plan: Access): boolean {
  return RANK[plan] >= RANK[pieceAccess];
}

// How many blocks a reader without the right plan sees before the upgrade card.
export const PREVIEW_BLOCKS = 4;
