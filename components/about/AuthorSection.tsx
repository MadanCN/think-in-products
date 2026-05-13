"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, MapPin, Twitter, Linkedin, Github, Briefcase, GraduationCap, User } from "lucide-react";
import type { ProfileSettings, SocialSettings, EducationItem, ExperienceItem } from "@/app/actions/settings";

interface AuthorSectionProps {
  profile: ProfileSettings;
  social: SocialSettings;
  education: EducationItem[];
  experience: ExperienceItem[];
  gallery: string[];
}

export default function AuthorSection({ profile, social, education, experience, gallery }: AuthorSectionProps) {
  const [open, setOpen] = useState(false);

  const hasContent = profile.name || profile.bio || education.length > 0 || experience.length > 0;
  if (!hasContent) return null;

  const hasSocial = social.twitter || social.linkedin || social.github || social.other.length > 0;
  const hasGallery = gallery.filter(Boolean).length > 0;

  return (
    <>
      {/* Trigger button */}
      <button
        onClick={() => setOpen(true)}
        className="group inline-flex items-center gap-2.5 px-5 py-2.5 rounded-xl border border-border bg-bg-card text-text-secondary hover:text-text-primary hover:border-accent-primary/40 hover:bg-accent-primary/5 transition-all text-sm font-medium"
      >
        <User className="w-4 h-4 text-accent-primary" />
        Know the author
      </button>

      {/* Modal overlay */}
      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
              onClick={() => setOpen(false)}
              aria-hidden="true"
            />

            {/* Slide-up panel */}
            <motion.div
              key="panel"
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 40 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="fixed inset-x-0 bottom-0 z-50 md:inset-0 md:flex md:items-center md:justify-center md:p-8"
              aria-modal="true"
              role="dialog"
              aria-label="About the author"
            >
              <div className="relative w-full md:max-w-2xl max-h-[90vh] md:max-h-[85vh] overflow-y-auto rounded-t-3xl md:rounded-3xl border border-border bg-bg-primary shadow-2xl">

                {/* Close button */}
                <button
                  onClick={() => setOpen(false)}
                  className="absolute top-4 right-4 z-10 p-2 rounded-xl bg-bg-secondary border border-border text-text-muted hover:text-text-primary transition-colors"
                  aria-label="Close"
                >
                  <X className="w-4 h-4" />
                </button>

                <div className="p-6 md:p-8 space-y-8">

                  {/* Profile header */}
                  <div className="flex gap-5 items-start">
                    {profile.profile_image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={profile.profile_image_url}
                        alt={profile.name || "Author photo"}
                        className="w-20 h-20 rounded-2xl object-cover border border-border shrink-0"
                      />
                    ) : (
                      <div className="w-20 h-20 rounded-2xl bg-accent-primary/10 border border-accent-primary/20 flex items-center justify-center shrink-0">
                        <span className="font-display text-2xl font-bold text-accent-primary">
                          {profile.name?.[0]?.toUpperCase() ?? "A"}
                        </span>
                      </div>
                    )}

                    <div className="flex-1 min-w-0 space-y-1.5">
                      {profile.name && (
                        <h2 className="font-display text-2xl font-bold text-text-primary">{profile.name}</h2>
                      )}
                      {profile.title && (
                        <p className="font-mono text-sm text-accent-primary">{profile.title}</p>
                      )}
                      {profile.location && (
                        <p className="flex items-center gap-1.5 text-sm text-text-muted font-mono">
                          <MapPin className="w-3.5 h-3.5" />
                          {profile.location}
                        </p>
                      )}
                      {hasSocial && (
                        <div className="flex items-center gap-1 pt-1">
                          {social.twitter && (
                            <a href={social.twitter.startsWith("http") ? social.twitter : `https://twitter.com/${social.twitter.replace("@", "")}`} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded-lg text-text-muted hover:text-accent-primary hover:bg-accent-primary/10 transition-colors">
                              <Twitter className="w-3.5 h-3.5" />
                            </a>
                          )}
                          {social.linkedin && (
                            <a href={social.linkedin} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded-lg text-text-muted hover:text-accent-primary hover:bg-accent-primary/10 transition-colors">
                              <Linkedin className="w-3.5 h-3.5" />
                            </a>
                          )}
                          {social.github && (
                            <a href={social.github} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded-lg text-text-muted hover:text-accent-primary hover:bg-accent-primary/10 transition-colors">
                              <Github className="w-3.5 h-3.5" />
                            </a>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Bio */}
                  {profile.bio && (
                    <p className="text-text-secondary leading-relaxed">{profile.bio}</p>
                  )}

                  {/* Experience */}
                  {experience.length > 0 && (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2.5">
                        <Briefcase className="w-4 h-4 text-accent-primary" />
                        <h3 className="font-display text-lg font-bold text-text-primary">Experience</h3>
                      </div>
                      <div className="space-y-0">
                        {experience.map((exp, i) => (
                          <div key={i} className="flex gap-4 relative">
                            <div className="flex flex-col items-center shrink-0 w-3">
                              <div className="w-2.5 h-2.5 rounded-full border-2 border-accent-primary bg-bg-primary mt-1.5 shrink-0" />
                              {i < experience.length - 1 && (
                                <div className="w-px flex-1 bg-border mt-1" />
                              )}
                            </div>
                            <div className="flex-1 pb-5">
                              <div className="flex items-start justify-between gap-3 flex-wrap">
                                <div>
                                  <p className="font-display font-bold text-text-primary text-sm">{exp.role}</p>
                                  <p className="text-accent-primary text-xs font-mono mt-0.5">{exp.company}</p>
                                </div>
                                {exp.period && (
                                  <span className="font-mono text-xs text-text-muted bg-bg-secondary px-2 py-0.5 rounded-full border border-border shrink-0">
                                    {exp.period}
                                  </span>
                                )}
                              </div>
                              {exp.description && (
                                <p className="text-text-secondary text-xs leading-relaxed mt-1.5">{exp.description}</p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Education */}
                  {education.length > 0 && (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2.5">
                        <GraduationCap className="w-4 h-4 text-accent-primary" />
                        <h3 className="font-display text-lg font-bold text-text-primary">Education</h3>
                      </div>
                      <div className="grid gap-3 sm:grid-cols-2">
                        {education.map((edu, i) => (
                          <div key={i} className="rounded-xl border border-border bg-bg-card p-4 space-y-1">
                            <p className="font-display font-bold text-text-primary text-sm">{edu.institution}</p>
                            <p className="text-text-secondary text-xs">
                              {edu.degree}{edu.field ? ` · ${edu.field}` : ""}
                            </p>
                            {edu.year && (
                              <p className="font-mono text-xs text-text-muted">{edu.year}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Gallery */}
                  {hasGallery && (
                    <div className="grid grid-cols-3 gap-2">
                      {gallery.filter(Boolean).map((url, i) => (
                        <div key={i} className="aspect-square rounded-xl overflow-hidden border border-border">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={url} alt="" className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}