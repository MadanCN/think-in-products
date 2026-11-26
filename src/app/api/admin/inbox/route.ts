import { NextResponse } from "next/server";
import { z } from "zod";
import { denyUnlessAdmin } from "@/lib/admin-auth";
import { deleteInboxItem, listInbox, setInboxStatus } from "@/lib/repo";

export async function GET(request: Request) {
  const denied = await denyUnlessAdmin(request);
  if (denied) return denied;
  return NextResponse.json({ items: await listInbox() });
}

const patch = z.object({ id: z.string().min(1).max(64), status: z.enum(["new", "read", "archived"]) });

export async function PATCH(request: Request) {
  const denied = await denyUnlessAdmin(request);
  if (denied) return denied;
  const parsed = patch.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "Bad request" }, { status: 400 });
  await setInboxStatus(parsed.data.id, parsed.data.status);
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request) {
  const denied = await denyUnlessAdmin(request);
  if (denied) return denied;
  const id = new URL(request.url).searchParams.get("id") ?? "";
  if (!id) return NextResponse.json({ error: "Bad request" }, { status: 400 });
  await deleteInboxItem(id);
  return NextResponse.json({ ok: true });
}
