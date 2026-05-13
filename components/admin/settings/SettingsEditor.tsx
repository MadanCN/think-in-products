"use client";

import { useState, useRef, useCallback } from "react";
import { Loader2, CheckCheck, Plus, Trash2, GripVertical } from "lucide-react";
import { updateSettings } from "@/app/actions/settings";
import type { SiteSettings, SettingsKey } from "@/app/actions/settings";
import { useToast, ToastContainer } from "@/components/admin/Toast";
import { cn } from "@/lib/utils";

type Tab = SettingsKey;
const TABS: { key: Tab; label: string }[] = [
  { key: "profile", label: "Profile" },
  { key: "about",   label: "About" },
  { key: "social",  label: "Social" },
  { key: "hero",    label: "Hero" },
  { key: "seo",     label: "SEO" },
];

type SaveState = "saved" | "saving" | "modified";

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between">
        <label className="font-mono text-xs text-text-muted uppercase tracking-wider">{label}</label>
        {hint && <span className="text-xs text-text-muted italic">{hint}</span>}
      </div>
      {children}
    </div>
  );
}

function Input({ value, onChange, placeholder, type = "text", readOnly }: {
  value: string; onChange?: (v: string) => void; placeholder?: string; type?: string; readOnly?: boolean;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={onChange ? (e) => onChange(e.target.value) : undefined}
      readOnly={readOnly}
      placeholder={placeholder}
      className="w-full px-4 py-2.5 rounded-xl bg-bg-secondary border border-border text-text-primary placeholder:text-text-muted text-sm outline-none focus:border-accent-primary/50 transition-colors"
    />
  );
}

function Textarea({ value, onChange, placeholder, rows = 3 }: {
  value: string; onChange: (v: string) => void; placeholder?: string; rows?: number;
}) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      className="w-full px-4 py-2.5 rounded-xl bg-bg-secondary border border-border text-text-primary placeholder:text-text-muted text-sm outline-none focus:border-accent-primary/50 transition-colors resize-none"
    />
  );
}

interface Props {
  initialSettings: SiteSettings;
}

export function SettingsEditor({ initialSettings }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>("profile");
  const [settings, setSettings] = useState<SiteSettings>(initialSettings);
  const [saveStates, setSaveStates] = useState<Record<Tab, SaveState>>({
    profile: "saved", about: "saved", social: "saved", hero: "saved", seo: "saved",
  });
  const [lastSaved, setLastSaved] = useState<Record<Tab, string | null>>({
    profile: null, about: null, social: null, hero: null, seo: null,
  });

  const { toasts, toast, dismiss } = useToast();
  const settingsRef = useRef(settings);
  settingsRef.current = settings;
  const debounceRefs = useRef<Partial<Record<Tab, ReturnType<typeof setTimeout>>>>({});

  const scheduleSave = useCallback((tab: Tab) => {
    if (debounceRefs.current[tab]) clearTimeout(debounceRefs.current[tab]);
    debounceRefs.current[tab] = setTimeout(async () => {
      setSaveStates((prev) => ({ ...prev, [tab]: "saving" }));
      try {
        await updateSettings(tab, settingsRef.current[tab]);
        setSaveStates((prev) => ({ ...prev, [tab]: "saved" }));
        setLastSaved((prev) => ({ ...prev, [tab]: new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }) }));
      } catch {
        setSaveStates((prev) => ({ ...prev, [tab]: "modified" }));
        toast({ message: `Failed to save ${tab} settings`, type: "error" });
      }
    }, 2500);
  }, [toast]);

  function updateField<K extends Tab>(tab: K, field: keyof SiteSettings[K], value: SiteSettings[K][typeof field]) {
    setSettings((prev) => ({ ...prev, [tab]: { ...prev[tab], [field]: value } }));
    setSaveStates((prev) => ({ ...prev, [tab]: "modified" }));
    scheduleSave(tab);
  }

  async function saveNow(tab: Tab) {
    if (debounceRefs.current[tab]) clearTimeout(debounceRefs.current[tab]);
    setSaveStates((prev) => ({ ...prev, [tab]: "saving" }));
    try {
      await updateSettings(tab, settingsRef.current[tab]);
      setSaveStates((prev) => ({ ...prev, [tab]: "saved" }));
      setLastSaved((prev) => ({ ...prev, [tab]: new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }) }));
      toast({ message: `${tab.charAt(0).toUpperCase() + tab.slice(1)} settings saved` });
    } catch {
      setSaveStates((prev) => ({ ...prev, [tab]: "modified" }));
      toast({ message: "Save failed", type: "error" });
    }
  }

  const p   = settings.profile;
  const s   = settings.social;
  const h   = settings.hero;
  const seo = settings.seo;
  const ab  = settings.about;
  const state = saveStates[activeTab];

  return (
    <>
      <div className="space-y-6">
        {/* Page header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold text-text-primary">Site Settings</h1>
            <p className="text-text-secondary text-sm mt-1">Global configuration for Think In Products.</p>
          </div>

          <div className="flex items-center gap-3 pt-1">
            {state === "saving" && (
              <span className="flex items-center gap-1.5 font-mono text-xs text-text-muted">
                <Loader2 className="w-3 h-3 animate-spin" /> Saving…
              </span>
            )}
            {state === "saved" && lastSaved[activeTab] && (
              <span className="flex items-center gap-1.5 font-mono text-xs text-emerald-400">
                <CheckCheck className="w-3.5 h-3.5" /> Saved {lastSaved[activeTab]}
              </span>
            )}
            {state === "modified" && (
              <span className="font-mono text-xs text-amber-400">Unsaved changes</span>
            )}
            <button
              onClick={() => saveNow(activeTab)}
              disabled={state === "saving" || state === "saved"}
              className="px-3.5 py-1.5 rounded-lg bg-accent-primary text-bg-primary text-xs font-semibold hover:bg-accent-primary/90 transition-colors disabled:opacity-50"
            >
              Save
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-bg-secondary rounded-xl border border-border w-fit">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={cn(
                "px-4 py-1.5 rounded-lg text-sm font-mono transition-all relative",
                activeTab === t.key
                  ? "bg-accent-primary/10 text-accent-primary border border-accent-primary/20"
                  : "text-text-muted hover:text-text-secondary"
              )}
            >
              {t.label}
              {saveStates[t.key] === "modified" && (
                <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-amber-400" />
              )}
            </button>
          ))}
        </div>

        {/* Panel */}
        <div className="rounded-2xl border border-border bg-bg-card p-6 space-y-5">

          {/* ── Profile ── */}
          {activeTab === "profile" && (
            <>
              <Field label="Display name">
                <Input value={p.name} onChange={(v) => updateField("profile", "name", v)} placeholder="Your name" />
              </Field>
              <Field label="Title / Role">
                <Input value={p.title} onChange={(v) => updateField("profile", "title", v)} placeholder="Product Manager" />
              </Field>
              <Field label="Bio" hint="Short version shown on cards">
                <Textarea value={p.bio} onChange={(v) => updateField("profile", "bio", v)} placeholder="A short bio…" rows={4} />
              </Field>
              <Field label="Profile image URL">
                <Input value={p.profile_image_url} onChange={(v) => updateField("profile", "profile_image_url", v)} placeholder="https://…" type="url" />
                {p.profile_image_url && (
                  <div className="mt-2 w-16 h-16 rounded-full overflow-hidden border border-border">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={p.profile_image_url} alt="Profile preview" className="w-full h-full object-cover" />
                  </div>
                )}
              </Field>
              <Field label="Location">
                <Input value={p.location} onChange={(v) => updateField("profile", "location", v)} placeholder="Bengaluru, India" />
              </Field>
            </>
          )}

          {/* ── About ── */}
          {activeTab === "about" && (
            <>
              {/* Brand section */}
              <p className="font-mono text-xs text-text-muted uppercase tracking-widest pb-1 border-b border-border">Brand — Think in Products</p>
              <Field label="Headline" hint="Main title shown on the About page">
                <Input value={ab.headline} onChange={(v) => updateField("about", "headline", v)} placeholder="About Think in Products" />
              </Field>
              <Field label="Subheadline" hint="One-liner shown below the headline">
                <Textarea value={ab.subheadline} onChange={(v) => updateField("about", "subheadline", v)} placeholder="A structured learning space for product managers…" rows={2} />
              </Field>
              <Field label="Body" hint="Brand description — separate paragraphs with a blank line">
                <Textarea value={ab.body ?? ""} onChange={(v) => updateField("about", "body" as keyof typeof ab, v as never)} placeholder={"Tell the story of Think in Products…\n\nWhat problem does it solve? Who is it for?"} rows={8} />
              </Field>

              {/* Author section */}
              <p className="font-mono text-xs text-text-muted uppercase tracking-widest pt-4 pb-1 border-b border-border">Author — Personal details (shown in popup)</p>

              {/* Education */}
              <Field label="Education">
                <div className="space-y-3">
                  {ab.education.map((edu, i) => (
                    <div key={i} className="grid grid-cols-2 gap-2 p-3 rounded-xl border border-border bg-bg-secondary/40 relative group">
                      <GripVertical className="absolute left-1.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted/40 opacity-0 group-hover:opacity-100 transition-opacity" />
                      <input
                        type="text"
                        value={edu.institution}
                        onChange={(e) => {
                          const next = ab.education.map((d, j) => j === i ? { ...d, institution: e.target.value } : d);
                          updateField("about", "education", next);
                        }}
                        placeholder="Institution"
                        className="px-3 py-2 rounded-lg bg-bg-secondary border border-border text-text-primary placeholder:text-text-muted text-sm outline-none focus:border-accent-primary/50 transition-colors"
                      />
                      <input
                        type="text"
                        value={edu.degree}
                        onChange={(e) => {
                          const next = ab.education.map((d, j) => j === i ? { ...d, degree: e.target.value } : d);
                          updateField("about", "education", next);
                        }}
                        placeholder="Degree (e.g. B.Tech)"
                        className="px-3 py-2 rounded-lg bg-bg-secondary border border-border text-text-primary placeholder:text-text-muted text-sm outline-none focus:border-accent-primary/50 transition-colors"
                      />
                      <input
                        type="text"
                        value={edu.field}
                        onChange={(e) => {
                          const next = ab.education.map((d, j) => j === i ? { ...d, field: e.target.value } : d);
                          updateField("about", "education", next);
                        }}
                        placeholder="Field of study"
                        className="px-3 py-2 rounded-lg bg-bg-secondary border border-border text-text-primary placeholder:text-text-muted text-sm outline-none focus:border-accent-primary/50 transition-colors"
                      />
                      <input
                        type="text"
                        value={edu.year}
                        onChange={(e) => {
                          const next = ab.education.map((d, j) => j === i ? { ...d, year: e.target.value } : d);
                          updateField("about", "education", next);
                        }}
                        placeholder="Year (e.g. 2020)"
                        className="px-3 py-2 rounded-lg bg-bg-secondary border border-border text-text-primary placeholder:text-text-muted text-sm outline-none focus:border-accent-primary/50 transition-colors"
                      />
                      <button
                        onClick={() => updateField("about", "education", ab.education.filter((_, j) => j !== i))}
                        className="col-span-2 flex items-center justify-center gap-1 py-1 rounded-lg border border-dashed border-rose-500/20 text-rose-400 text-xs hover:bg-rose-500/10 transition-colors"
                      >
                        <Trash2 className="w-3 h-3" /> Remove
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() => updateField("about", "education", [...ab.education, { institution: "", degree: "", field: "", year: "" }])}
                    className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-dashed border-border text-text-muted text-xs font-mono hover:border-accent-primary/40 hover:text-text-secondary transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add education
                  </button>
                </div>
              </Field>

              {/* Experience */}
              <Field label="Experience">
                <div className="space-y-3">
                  {ab.experience.map((exp, i) => (
                    <div key={i} className="p-3 rounded-xl border border-border bg-bg-secondary/40 space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          value={exp.company}
                          onChange={(e) => {
                            const next = ab.experience.map((d, j) => j === i ? { ...d, company: e.target.value } : d);
                            updateField("about", "experience", next);
                          }}
                          placeholder="Company"
                          className="px-3 py-2 rounded-lg bg-bg-secondary border border-border text-text-primary placeholder:text-text-muted text-sm outline-none focus:border-accent-primary/50 transition-colors"
                        />
                        <input
                          type="text"
                          value={exp.role}
                          onChange={(e) => {
                            const next = ab.experience.map((d, j) => j === i ? { ...d, role: e.target.value } : d);
                            updateField("about", "experience", next);
                          }}
                          placeholder="Role / Title"
                          className="px-3 py-2 rounded-lg bg-bg-secondary border border-border text-text-primary placeholder:text-text-muted text-sm outline-none focus:border-accent-primary/50 transition-colors"
                        />
                        <input
                          type="text"
                          value={exp.period}
                          onChange={(e) => {
                            const next = ab.experience.map((d, j) => j === i ? { ...d, period: e.target.value } : d);
                            updateField("about", "experience", next);
                          }}
                          placeholder="Period (e.g. 2022 – Present)"
                          className="col-span-2 px-3 py-2 rounded-lg bg-bg-secondary border border-border text-text-primary placeholder:text-text-muted text-sm outline-none focus:border-accent-primary/50 transition-colors"
                        />
                      </div>
                      <textarea
                        value={exp.description}
                        onChange={(e) => {
                          const next = ab.experience.map((d, j) => j === i ? { ...d, description: e.target.value } : d);
                          updateField("about", "experience", next);
                        }}
                        placeholder="What you did, what you built, what you learned…"
                        rows={2}
                        className="w-full px-3 py-2 rounded-lg bg-bg-secondary border border-border text-text-primary placeholder:text-text-muted text-sm outline-none focus:border-accent-primary/50 transition-colors resize-none"
                      />
                      <button
                        onClick={() => updateField("about", "experience", ab.experience.filter((_, j) => j !== i))}
                        className="w-full flex items-center justify-center gap-1 py-1 rounded-lg border border-dashed border-rose-500/20 text-rose-400 text-xs hover:bg-rose-500/10 transition-colors"
                      >
                        <Trash2 className="w-3 h-3" /> Remove
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() => updateField("about", "experience", [...ab.experience, { company: "", role: "", period: "", description: "" }])}
                    className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-dashed border-border text-text-muted text-xs font-mono hover:border-accent-primary/40 hover:text-text-secondary transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add experience
                  </button>
                </div>
              </Field>

              {/* Gallery */}
              <Field label="Gallery" hint="Image URLs shown in a grid on the About page">
                <div className="space-y-2">
                  {ab.gallery.map((url, i) => (
                    <div key={i} className="flex gap-2 items-center">
                      <input
                        type="url"
                        value={url}
                        onChange={(e) => {
                          const next = ab.gallery.map((u, j) => j === i ? e.target.value : u);
                          updateField("about", "gallery", next);
                        }}
                        placeholder="https://…"
                        className="flex-1 px-3 py-2 rounded-xl bg-bg-secondary border border-border text-text-primary placeholder:text-text-muted text-sm outline-none focus:border-accent-primary/50 transition-colors"
                      />
                      {url && (
                        <div className="w-10 h-10 rounded-lg overflow-hidden border border-border shrink-0">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={url} alt="" className="w-full h-full object-cover" />
                        </div>
                      )}
                      <button
                        onClick={() => updateField("about", "gallery", ab.gallery.filter((_, j) => j !== i))}
                        className="p-2 rounded-xl border border-border text-text-muted hover:text-rose-400 hover:border-rose-500/30 transition-colors shrink-0"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() => updateField("about", "gallery", [...ab.gallery, ""])}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-dashed border-border text-text-muted text-xs font-mono hover:border-accent-primary/40 hover:text-text-secondary transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add image
                  </button>
                  {/* Preview grid */}
                  {ab.gallery.filter(Boolean).length > 0 && (
                    <div className="grid grid-cols-4 gap-2 mt-3">
                      {ab.gallery.filter(Boolean).map((url, i) => (
                        <div key={i} className="aspect-square rounded-xl overflow-hidden border border-border">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={url} alt="" className="w-full h-full object-cover" />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </Field>
            </>
          )}

          {/* ── Social ── */}
          {activeTab === "social" && (
            <>
              <Field label="Twitter / X handle">
                <Input value={s.twitter} onChange={(v) => updateField("social", "twitter", v)} placeholder="@handle" />
              </Field>
              <Field label="LinkedIn URL">
                <Input value={s.linkedin} onChange={(v) => updateField("social", "linkedin", v)} placeholder="https://linkedin.com/in/…" type="url" />
              </Field>
              <Field label="GitHub URL">
                <Input value={s.github} onChange={(v) => updateField("social", "github", v)} placeholder="https://github.com/…" type="url" />
              </Field>
              <Field label="Other links">
                <div className="space-y-2">
                  {s.other.map((item, i) => (
                    <div key={i} className="flex gap-2">
                      <input
                        type="text"
                        value={item.platform}
                        onChange={(e) => {
                          const next = s.other.map((o, j) => j === i ? { ...o, platform: e.target.value } : o);
                          updateField("social", "other", next);
                        }}
                        placeholder="Platform"
                        className="w-32 shrink-0 px-3 py-2 rounded-xl bg-bg-secondary border border-border text-text-primary placeholder:text-text-muted text-sm outline-none focus:border-accent-primary/50 transition-colors"
                      />
                      <input
                        type="url"
                        value={item.url}
                        onChange={(e) => {
                          const next = s.other.map((o, j) => j === i ? { ...o, url: e.target.value } : o);
                          updateField("social", "other", next);
                        }}
                        placeholder="https://…"
                        className="flex-1 px-3 py-2 rounded-xl bg-bg-secondary border border-border text-text-primary placeholder:text-text-muted text-sm outline-none focus:border-accent-primary/50 transition-colors"
                      />
                      <button
                        onClick={() => updateField("social", "other", s.other.filter((_, j) => j !== i))}
                        className="p-2 rounded-xl border border-border text-text-muted hover:text-rose-400 hover:border-rose-500/30 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() => updateField("social", "other", [...s.other, { platform: "", url: "" }])}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-dashed border-border text-text-muted text-xs font-mono hover:border-accent-primary/40 hover:text-text-secondary transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add link
                  </button>
                </div>
              </Field>
            </>
          )}

          {/* ── Hero ── */}
          {activeTab === "hero" && (
            <>
              <Field label="Tagline" hint="Main headline">
                <Input value={h.tagline} onChange={(v) => updateField("hero", "tagline", v)} placeholder="Think in Products" />
              </Field>
              <Field label="Subheadline">
                <Textarea value={h.subheadline} onChange={(v) => updateField("hero", "subheadline", v)} placeholder="A short supporting line…" rows={2} />
              </Field>
              <Field label="Primary CTA label">
                <Input value={h.cta_primary} onChange={(v) => updateField("hero", "cta_primary", v)} placeholder="Explore Roadmap" />
              </Field>
              <Field label="Secondary CTA label">
                <Input value={h.cta_secondary} onChange={(v) => updateField("hero", "cta_secondary", v)} placeholder="Read Articles" />
              </Field>
            </>
          )}

          {/* ── SEO ── */}
          {activeTab === "seo" && (
            <>
              <Field label="Site title" hint="Browser tab + OG title">
                <Input value={seo.site_title} onChange={(v) => updateField("seo", "site_title", v)} placeholder="Think In Products" />
              </Field>
              <Field label="Meta description" hint="150–160 chars">
                <div className="relative">
                  <Textarea
                    value={seo.meta_description}
                    onChange={(v) => v.length <= 160 && updateField("seo", "meta_description", v)}
                    placeholder="A short description for search engines…"
                    rows={3}
                  />
                  <span className={cn("absolute bottom-2.5 right-3 font-mono text-xs pointer-events-none", seo.meta_description.length > 140 ? "text-amber-400" : "text-text-muted")}>
                    {seo.meta_description.length}/160
                  </span>
                </div>
              </Field>
              <Field label="OG image URL" hint="1200×630 recommended">
                <Input value={seo.og_image_url} onChange={(v) => updateField("seo", "og_image_url", v)} placeholder="https://…" type="url" />
                {seo.og_image_url && (
                  <div className="mt-2 h-28 rounded-xl overflow-hidden border border-border">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={seo.og_image_url} alt="OG image preview" className="w-full h-full object-cover" />
                  </div>
                )}
              </Field>
              <Field label="Twitter handle" hint="Without @">
                <Input value={seo.twitter_handle} onChange={(v) => updateField("seo", "twitter_handle", v)} placeholder="thinkinproducts" />
              </Field>
            </>
          )}
        </div>
      </div>

      <ToastContainer toasts={toasts} dismiss={dismiss} />
    </>
  );
}
