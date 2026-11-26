import { NextResponse } from "next/server";
import { denyUnlessAdmin } from "@/lib/admin-auth";
import { deletePiece, getPiece } from "@/lib/repo";

export async function GET(request: Request, ctx: RouteContext<"/api/admin/pieces/[id]">) {
  const denied = await denyUnlessAdmin(request);
  if (denied) return denied;
  const { id } = await ctx.params;
  const piece = await getPiece(id);
  return piece ? NextResponse.json({ piece }) : NextResponse.json({ error: "Not found" }, { status: 404 });
}

export async function DELETE(request: Request, ctx: RouteContext<"/api/admin/pieces/[id]">) {
  const denied = await denyUnlessAdmin(request);
  if (denied) return denied;
  const { id } = await ctx.params;
  try {
    await deletePiece(id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Couldn't delete" }, { status: 500 });
  }
}
