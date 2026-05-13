"use client";

import { useRef, useState } from "react";
import { Upload, Loader2, X } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";

interface Props {
  value: string;
  onChange: (url: string) => void;
  folder: string;          // storage path prefix, e.g. "articles", "portfolio"
  aspect?: "wide" | "square"; // preview shape — wide ≈ 16:9, square = 1:1
  placeholder?: string;
  inputClassName?: string;
}

export function ImageUpload({
  value,
  onChange,
  folder,
  aspect = "wide",
  placeholder = "https://…",
  inputClassName,
}: Props) {
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    setUploading(true);
    try {
      const ext = file.name.split(".").pop() ?? "jpg";
      const name = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("media")
        .upload(name, file, { upsert: false, contentType: file.type });
      if (upErr) throw upErr;
      const { data } = supabase.storage.from("media").getPublicUrl(name);
      onChange(data.publicUrl);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-2">
      {/* URL input + upload trigger */}
      <div className="flex gap-2">
        <input
          type="url"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={cn(
            "flex-1 px-4 py-2.5 rounded-xl bg-bg-secondary border border-border text-text-primary placeholder:text-text-muted text-sm outline-none focus:border-accent-primary/50 transition-colors",
            inputClassName
          )}
        />
        <button
          type="button"
          disabled={uploading}
          onClick={() => fileRef.current?.click()}
          title="Upload from computer"
          className="shrink-0 inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-dashed border-border text-text-muted text-xs font-mono hover:border-accent-primary/40 hover:text-text-secondary transition-colors disabled:opacity-50 whitespace-nowrap"
        >
          {uploading
            ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Uploading…</>
            : <><Upload className="w-3.5 h-3.5" /> Upload</>
          }
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void handleFile(f);
            e.target.value = "";
          }}
        />
      </div>

      {/* Preview */}
      {value && (
        <div className={cn(
          "relative rounded-xl overflow-hidden border border-border group",
          aspect === "square" ? "w-28 h-28" : "h-32 w-full"
        )}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt="" className="w-full h-full object-cover" />
          <button
            type="button"
            onClick={() => onChange("")}
            title="Remove image"
            className="absolute top-1.5 right-1.5 p-1 rounded-lg bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/80"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
