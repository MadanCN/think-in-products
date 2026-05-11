"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Plus, Send } from "lucide-react";

interface PageConfig {
  title: string;
  action?: {
    label: string;
    href: string;
    icon: React.ElementType;
  };
}

const PAGE_CONFIG: Record<string, PageConfig> = {
  "/admin/dashboard": { title: "Dashboard" },
  "/admin/roadmap": {
    title: "Roadmap",
    action: { label: "Add Node", href: "/admin/roadmap/new", icon: Plus },
  },
  "/admin/articles": {
    title: "Articles",
    action: { label: "New Article", href: "/admin/articles/new", icon: Plus },
  },
  "/admin/portfolio": {
    title: "Portfolio",
    action: { label: "New Case Study", href: "/admin/portfolio/new", icon: Plus },
  },
  "/admin/newsletter": {
    title: "Newsletter",
    action: { label: "Compose", href: "/admin/newsletter/compose", icon: Send },
  },
  "/admin/settings": { title: "Site Settings" },
};

function matchConfig(pathname: string): PageConfig {
  if (PAGE_CONFIG[pathname]) return PAGE_CONFIG[pathname];
  // Match prefix (e.g. /admin/articles/new → Articles)
  const prefix = Object.keys(PAGE_CONFIG).find((k) =>
    pathname.startsWith(k + "/")
  );
  return prefix ? PAGE_CONFIG[prefix] : { title: "Admin" };
}

export default function AdminHeader() {
  const pathname = usePathname();
  const { title, action } = matchConfig(pathname);
  const ActionIcon = action?.icon;

  return (
    <header className="h-14 border-b border-border flex items-center justify-between px-8 bg-bg-primary/60 backdrop-blur-sm shrink-0 sticky top-0 z-30">
      <p className="font-display font-semibold text-sm text-text-primary">
        {title}
      </p>

      {action && ActionIcon && (
        <Link
          href={action.href}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-accent-primary text-bg-primary text-xs font-semibold hover:bg-accent-primary/90 transition-colors"
        >
          <ActionIcon className="w-3.5 h-3.5" />
          {action.label}
        </Link>
      )}
    </header>
  );
}
