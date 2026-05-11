"use client";

import { usePathname } from "next/navigation";
import { Bell } from "lucide-react";

const titles: Record<string, string> = {
  "/admin/dashboard": "Dashboard",
  "/admin/roadmap": "Roadmap",
  "/admin/articles": "Articles",
  "/admin/portfolio": "Portfolio",
  "/admin/newsletter": "Newsletter",
};

export default function AdminHeader() {
  const pathname = usePathname();
  const title = titles[pathname] ?? "Admin";

  return (
    <header className="h-14 border-b border-border flex items-center justify-between px-8 bg-bg-primary/60 backdrop-blur-sm">
      <p className="font-display font-semibold text-sm text-text-primary">{title}</p>
      <div className="flex items-center gap-3">
        <button className="relative p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-white/5 transition-colors">
          <Bell className="w-4 h-4" />
        </button>
        <div className="w-7 h-7 rounded-full bg-accent-primary/20 border border-accent-primary/30 flex items-center justify-center">
          <span className="font-mono text-xs font-bold text-accent-primary">A</span>
        </div>
      </div>
    </header>
  );
}
