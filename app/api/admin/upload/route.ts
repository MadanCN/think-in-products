import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";

const ALLOWED_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
]);

const ALLOWED_FOLDERS = new Set(["articles", "portfolio", "gallery", "seo", "profiles"]);

const MAX_BYTES = 5 * 1024 * 1024; // 5 MB

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get("file");
  const folder = formData.get("folder");
  const bucket = formData.get("bucket") ?? "media";

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }
  if (typeof folder !== "string" || !ALLOWED_FOLDERS.has(folder)) {
    return NextResponse.json({ error: "Invalid folder" }, { status: 400 });
  }
  if (typeof bucket !== "string" || !["media", "profiles"].includes(bucket)) {
    return NextResponse.json({ error: "Invalid bucket" }, { status: 400 });
  }
  if (!ALLOWED_MIME.has(file.type)) {
    return NextResponse.json({ error: "File type not allowed" }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "File exceeds 5 MB limit" }, { status: 400 });
  }

  const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
  const name = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  const supabase = createServerSupabaseClient();
  const bytes = await file.arrayBuffer();

  const { error } = await supabase.storage
    .from(bucket)
    .upload(name, bytes, { upsert: false, contentType: file.type });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const { data } = supabase.storage.from(bucket).getPublicUrl(name);
  return NextResponse.json({ url: data.publicUrl });
}
