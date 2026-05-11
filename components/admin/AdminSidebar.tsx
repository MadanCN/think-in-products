"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Map,
  FileText,
  Briefcase,
  Mail,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
  { label: "Roadmap", href: "/admin/roadmap", icon: Map },
  { label: "Articles", href: "/admin/articles", icon: FileText },
  { label: "Portfolio", href: "/admin/portfolio", icon: Briefcase },
  { label: "Newsletter", href: "/admin/newsletter", icon: Mail },
];

export default function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-56 shrink-0 border-r border-border flex flex-col bg-bg-secondary/40">
      {/* Brand */}
      <div className="h-14 flex items-center px-5 border-b border-border">
        <span className="font-display font-bold text-sm text-text-primary">
          tip<span className="text-accent-primary">.</span>admin
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-3 space-y-0.5">
        {navItems.map(({ label, href, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
                active
                  ? "bg-accent-primary/10 text-accent-primary"
                  : "text-text-secondary hover:bg-white/5 hover:text-text-primary"
              )}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Footer link */}
      <div className="p-3 border-t border-border">
        <Link
          href="/"
          target="_blank"
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-text-muted hover:text-text-secondary transition-colors"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          View site
        </Link>
      </div>
    </aside>
  );
}
