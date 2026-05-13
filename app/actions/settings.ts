"use server";

import { createServerSupabaseClient } from "@/lib/supabase";
import { logActivity } from "./activity";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ProfileSettings {
  name: string;
  title: string;
  bio: string;
  profile_image_url: string;
  location: string;
}

export interface SocialSettings {
  twitter: string;
  linkedin: string;
  github: string;
  other: Array<{ platform: string; url: string }>;
}

export interface HeroSettings {
  tagline: string;
  subheadline: string;
  cta_primary: string;
  cta_secondary: string;
}

export interface SeoSettings {
  site_title: string;
  meta_description: string;
  og_image_url: string;
  twitter_handle: string;
}

export interface EducationItem {
  institution: string;
  degree: string;
  field: string;
  year: string;
}

export interface ExperienceItem {
  company: string;
  role: string;
  period: string;
  description: string;
}

export interface AboutSettings {
  headline: string;
  subheadline: string;
  body: string;
  education: EducationItem[];
  experience: ExperienceItem[];
  gallery: string[];
}

export interface SiteSettings {
  profile: ProfileSettings;
  social: SocialSettings;
  hero: HeroSettings;
  seo: SeoSettings;
  about: AboutSettings;
}

export type SettingsKey = keyof SiteSettings;

const DEFAULT_SETTINGS: SiteSettings = {
  profile: {
    name: "",
    title: "",
    bio: "",
    profile_image_url: "",
    location: "",
  },
  social: {
    twitter: "",
    linkedin: "",
    github: "",
    other: [],
  },
  hero: {
    tagline: "Think in Products",
    subheadline: "A learning platform for aspiring and practising product managers.",
    cta_primary: "Explore Roadmap",
    cta_secondary: "Read Articles",
  },
  seo: {
    site_title: "Think In Products",
    meta_description: "",
    og_image_url: "",
    twitter_handle: "",
  },
  about: {
    headline: "",
    subheadline: "",
    body: "",
    education: [],
    experience: [],
    gallery: [],
  },
};

// ─── Actions ──────────────────────────────────────────────────────────────────

export async function getSettings(): Promise<SiteSettings> {
  const db = createServerSupabaseClient();
  const { data } = await db.from("site_settings").select("key, value");

  const result: SiteSettings = {
    profile: { ...DEFAULT_SETTINGS.profile },
    social: { ...DEFAULT_SETTINGS.social, other: [] },
    hero: { ...DEFAULT_SETTINGS.hero },
    seo: { ...DEFAULT_SETTINGS.seo },
    about: { ...DEFAULT_SETTINGS.about, body: "", education: [], experience: [], gallery: [] },
  };

  for (const row of data ?? []) {
    if (row.key in result) {
      (result as unknown as Record<string, unknown>)[row.key] = row.value;
    }
  }

  return result;
}

export async function updateSettings(
  key: SettingsKey,
  value: SiteSettings[SettingsKey]
): Promise<void> {
  const db = createServerSupabaseClient();
  const { error } = await db
    .from("site_settings")
    .upsert(
      { key, value, updated_at: new Date().toISOString() },
      { onConflict: "key" }
    );
  if (error) throw new Error(error.message);
  void logActivity({ action: "settings_updated", entity_type: "settings", entity_name: key });
}
