"use client";

import { motion } from "framer-motion";
import { Github, Linkedin, Twitter } from "lucide-react";
import { Badge } from "@/components/ui";
import type { ProfileSettings, SocialSettings, ToolItem } from "@/app/actions/settings";

function hexToRgba(hex: string, alpha: number): string {
  const h = hex.replace("#", "").padEnd(6, "0");
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

interface Props {
  profile: ProfileSettings;
  social: SocialSettings;
  shortBio?: string;
  tools?: ToolItem[];
}

export default function AboutSection({ profile, social, shortBio, tools = [] }: Props) {
  const bio = shortBio || profile.bio;
  if (!profile.name && !bio) return null;

  const initials = profile.name
    ?.split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "?";

  const socialLinks = [
    { href: social.twitter  ? `https://twitter.com/${social.twitter.replace(/^@/, "")}`  : null, Icon: Twitter,  label: "Twitter"  },
    { href: social.linkedin ? social.linkedin.startsWith("http") ? social.linkedin : `https://linkedin.com/in/${social.linkedin}` : null, Icon: Linkedin, label: "LinkedIn" },
    { href: social.github   ? social.github.startsWith("http") ? social.github : `https://github.com/${social.github}`   : null, Icon: Github,   label: "GitHub"   },
    ...social.other.map((o) => ({ href: o.url, Icon: Github, label: o.platform })),
  ].filter((l) => l.href);

  const visibleTools = tools.filter((t) => t.name.trim());

  return (
    <section className="py-24 px-6">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="rounded-3xl border border-border bg-bg-card/50 backdrop-blur-sm p-8 md:p-12"
        >
          <div className="flex flex-col md:flex-row gap-10 md:gap-16">

            {/* ── Left: avatar + social ── */}
            <div className="flex flex-col items-center md:items-start gap-5 shrink-0">
              <div className="relative">
                {profile.profile_image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={profile.profile_image_url}
                    alt={profile.name || "Profile photo"}
                    width={96}
                    height={96}
                    className="w-24 h-24 rounded-2xl object-cover border border-border"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-accent-primary/20 to-accent-secondary/20 border border-accent-primary/20 flex items-center justify-center">
                    <span className="font-display text-2xl font-extrabold text-accent-primary">
                      {initials}
                    </span>
                  </div>
                )}
                <span className="absolute -bottom-1.5 -right-1.5 w-4 h-4 rounded-full bg-emerald-400 border-2 border-bg-primary" />
              </div>

              {socialLinks.length > 0 && (
                <div className="flex gap-2.5">
                  {socialLinks.slice(0, 4).map(({ href, Icon, label }) => (
                    <a
                      key={label}
                      href={href!}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={label}
                      className="w-9 h-9 rounded-xl border border-border bg-bg-secondary flex items-center justify-center text-text-muted hover:text-accent-primary hover:border-accent-primary/30 transition-colors"
                    >
                      <Icon className="w-4 h-4" />
                    </a>
                  ))}
                </div>
              )}
            </div>

            {/* ── Right: text content ── */}
            <div className="flex-1 space-y-6">
              <div>
                <Badge variant="outline" className="font-mono text-accent-primary border-accent-primary/30 mb-4">
                  About
                </Badge>
                {profile.name && (
                  <h2 className="font-display text-2xl md:text-3xl font-bold text-text-primary leading-tight">
                    {profile.name}
                  </h2>
                )}
                {profile.title && (
                  <p className="font-mono text-sm text-accent-primary mt-1">{profile.title}</p>
                )}
              </div>

              {bio && (
                <p className="text-text-secondary leading-relaxed max-w-2xl">{bio}</p>
              )}

              {visibleTools.length > 0 && (
                <div>
                  <p className="font-mono text-xs text-text-muted uppercase tracking-widest mb-3">
                    Tools &amp; Stack
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {visibleTools.map((t) => (
                      <span
                        key={t.name}
                        style={{
                          backgroundColor: hexToRgba(t.color, 0.1),
                          color: t.color,
                          borderColor: hexToRgba(t.color, 0.25),
                        }}
                        className="inline-flex items-center px-3 py-1 rounded-full text-xs font-mono font-semibold border"
                      >
                        {t.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

          </div>
        </motion.div>
      </div>
    </section>
  );
}
