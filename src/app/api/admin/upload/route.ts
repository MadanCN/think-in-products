import { promises as fs } from "fs";
import { NextResponse } from "next/server";
import path from "path";
import { denyUnlessAdmin } from "@/lib/admin-auth";
import { serviceClient } from "@/lib/repo";
import { isSupabaseConfigured } from "@/lib/supabase/env";

// SVG is not accepted: an SVG file can carry scripts.
const TYPES: Record<string, string> = { "image/png": "png", "image/jpeg": "jpg", "image/webp": "webp", "image/gif": "gif", "image/avif": "avif" };

// Check the file really is the image type it claims to be, by its first bytes.
function looksLike(type: string, b: Uint8Array) {
  const at = (i: number, s: number[]) => s.every((x, j) => b[i + j] === x);
  switch (type) {
    case "image/png": return at(0, [0x89, 0x50, 0x4e, 0x47]);
    case "image/jpeg": return at(0, [0xff, 0xd8, 0xff]);
    case "image/gif": return at(0, [0x47, 0x49, 0x46, 0x38]);
    case "image/webp": return at(0, [0x52, 0x49, 0x46, 0x46]) && at(8, [0x57, 0x45, 0x42, 0x50]);
    case "image/avif": return at(4, [0x66, 0x74, 0x79, 0x70]);
    default: return false;
  }
}

// Upload an image. With Supabase: the "media" storage bucket. In local mode: public/uploads.
export async function POST(request: Request) {
  const denied = await denyUnlessAdmin(request);
  if (denied) return denied;
  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "No file" }, { status: 400 });
  const ext = TYPES[file.type];
  if (!ext) return NextResponse.json({ error: "Use a PNG, JPG, WebP, GIF or AVIF image." }, { status: 400 });
  if (file.size > 8 * 1024 * 1024) return NextResponse.json({ error: "Images must be under 8 MB." }, { status: 400 });
  const bytes = new Uint8Array(await file.arrayBuffer());
  if (!looksLike(file.type, bytes)) return NextResponse.json({ error: "That file isn't a valid image." }, { status: 400 });
  const name = `${new Date().toISOString().slice(0, 7)}/${crypto.randomUUID()}.${ext}`;

  if (!isSupabaseConfigured) {
    const dest = path.join(process.cwd(), "public", "uploads", name);
    await fs.mkdir(path.dirname(dest), { recursive: true });
    await fs.writeFile(dest, bytes);
    return NextResponse.json({ url: `/uploads/${name}` });
  }
  const db = serviceClient();
  if (!db) return NextResponse.json({ error: "Add SUPABASE_SERVICE_ROLE_KEY to upload images." }, { status: 500 });
  const { error } = await db.storage.from("media").upload(name, bytes, { contentType: file.type });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ url: db.storage.from("media").getPublicUrl(name).data.publicUrl });
}
