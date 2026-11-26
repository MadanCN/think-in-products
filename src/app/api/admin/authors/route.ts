import { NextResponse } from "next/server";
import { z } from "zod";
import { denyUnlessAdmin } from "@/lib/admin-auth";
import { deleteAuthor, listAuthors, saveAuthor } from "@/lib/repo";

const authorSchema = z.object({
  slug: z.string().max(60).default(""),
  name: z.string().trim().min(1, "Add a name.").max(120),
  role: z.string().max(160).default(""),
  short_bio: z.string().max(400).default(""),
  bio: z.string().max(8000).default(""),
  photo: z.string().max(500).default(""),
  avatar: z.string().max(500).default(""),
  links: z.array(z.object({ label: z.string().max(60), url: z.string().max(300) })).max(10).default([]),
});

export async function GET(request: Request) {
  const denied = await denyUnlessAdmin(request);
  if (denied) return denied;
  return NextResponse.json({ authors: await listAuthors() });
}

export async function POST(request: Request) {
  const denied = await denyUnlessAdmin(request);
  if (denied) return denied;
  const body = await request.json().catch(() => ({}));
  const parsed = authorSchema.safeParse(body.author);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Check the fields." }, { status: 400 });
  try {
    return NextResponse.json({ author: await saveAuthor(parsed.data, typeof body.previousSlug === "string" ? body.previousSlug : undefined) });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Couldn't save" }, { status: 400 });
  }
}

export async function DELETE(request: Request) {
  const denied = await denyUnlessAdmin(request);
  if (denied) return denied;
  const slug = new URL(request.url).searchParams.get("slug") ?? "";
  try {
    await deleteAuthor(slug);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Couldn't delete" }, { status: 400 });
  }
}
