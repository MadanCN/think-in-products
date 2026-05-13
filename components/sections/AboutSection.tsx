"use client";

import { motion } from "framer-motion";
import { Github, Linkedin, Twitter } from "lucide-react";
import { Badge } from "@/components/ui";
import type { ProfileSettings, SocialSettings } from "@/app/actions/settings";

const TOOLS = [
  { name: "Figma",     cls: "bg-[#FF7262]/10 text-[#FF7262]    border-[#FF7262]/25"   },
  { name: "Notion",    cls: "bg-white/8     text-text-primary  border-border"          },
  { name: "Linear",    cls: "bg-[#5E6AD2]/10 text-[#5E6AD2]   border-[#5E6AD2]/25"   },
  { name: "Supabase",  cls: "bg-[#3ECF8E]/10 text-[#3ECF8E]   border-[#3ECF8E]/25"   },
  { name: "Next.js",   cls: "bg-white/8     text-text-primary  border-border"          },
  { name: "SQL",       cls: "bg-accent-primary/10 text-accent-primary border-accent-primary/25" },
  { name: "Mixpanel",  cls: "bg-[#7856FF]/10 text-[#7856FF]   border-[#7856FF]/25"   },
  { name: "Miro",      cls: "bg-[#FFD02F]/10 text-[#FFD02F]   border-[#FFD02F]/25"   },
];

interface Props {
  profile: ProfileSettings;
  social: SocialSettings;
  shortBio?: string;
}

export default function AboutSection({ profile, social, shortBio }: Props) {
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
    { href: social.linkedin ? `https://linkedin.com/in/${social.linkedin}`                 : null, Icon: Linkedin, label: "LinkedIn" },
    { href: social.github   ? `https://github.com/${social.github}`                        : null, Icon: Github,   label: "GitHub"   },
    ...social.other.map((o) => ({ href: o.url, Icon: Github, label: o.platform })),
  ].filter((l) => l.href);

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
                {/* Online indicator */}
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

              {/* Tools */}
              <div>
                <p className="font-mono text-xs text-text-muted uppercase tracking-widest mb-3">
                  Tools &amp; Stack
                </p>
                <div className="flex flex-wrap gap-2">
                  {TOOLS.map((t) => (
                    <span
                      key={t.name}
                      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-mono font-semibold border ${t.cls}`}
                    >
                      {t.name}
                    </span>
                  ))}
                </div>
              </div>
            </div>

          </div>
        </motion.div>
      </div>
    </section>
  );
}
