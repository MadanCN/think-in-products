"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import {
  LayoutDashboard,
  Map,
  FileText,
  Briefcase,
  Users,
  Send,
  Mail,
  Settings,
  ClipboardList,
  ExternalLink,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  exact?: boolean;
}

interface NavSection {
  label: string;
  items: NavItem[];
}

const navSections: NavSection[] = [
  {
    label: "Content",
    items: [
      { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
      { label: "Roadmap", href: "/admin/roadmap", icon: Map },
      { label: "Articles", href: "/admin/articles", icon: FileText },
      { label: "Portfolio", href: "/admin/portfolio", icon: Briefcase },
    ],
  },
  {
    label: "Audience",
    items: [
      { label: "Subscribers", href: "/admin/newsletter", icon: Users, exact: true },
      { label: "Broadcast", href: "/admin/newsletter/broadcast", icon: Send },
      { label: "Welcome Email", href: "/admin/newsletter/welcome", icon: Mail },
    ],
  },
  {
    label: "Settings",
    items: [
      { label: "Site Settings", href: "/admin/settings", icon: Settings },
      { label: "Audit Log", href: "/admin/audit-log", icon: ClipboardList },
    ],
  },
];

interface AdminSidebarProps {
  userEmail?: string;
}

export default function AdminSidebar({ userEmail }: AdminSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/admin/login");
    router.refresh();
  }

  const initials = userEmail
    ? userEmail[0].toUpperCase()
    : "A";

  return (
    <aside className="fixed top-0 left-0 h-screen w-60 border-r border-border flex flex-col bg-bg-secondary/40 z-40">
      {/* Brand */}
      <div className="h-14 flex items-center px-4 border-b border-border shrink-0 gap-2.5">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.png" alt="" className="w-7 h-7 object-contain shrink-0" aria-hidden="true" />
        <span className="font-display font-bold text-sm">
          <span className="text-accent-primary">tip</span>
          <span className="text-text-muted">.</span>
          <span className="text-text-primary">admin</span>
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-3 space-y-6 overflow-y-auto">
        {navSections.map((section) => (
          <div key={section.label}>
            <p className="font-mono text-2xs text-text-muted uppercase tracking-widest px-3 mb-1.5">
              {section.label}
            </p>
            <ul className="space-y-0.5">
              {section.items.map(({ label, href, icon: Icon, exact }) => {
                const active = exact
                  ? pathname === href
                  : pathname === href || pathname.startsWith(href + "/");
                return (
                  <li key={href}>
                    <Link
                      href={href}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors border-l-2",
                        active
                          ? "border-accent-primary bg-bg-card text-accent-primary"
                          : "border-transparent text-text-secondary hover:bg-white/5 hover:text-text-primary"
                      )}
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      {label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}

      </nav>

      {/* Bottom — user + logout */}
      <div className="border-t border-border p-3 shrink-0 space-y-1">
        {/* View site */}
        <Link
          href="/"
          target="_blank"
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-text-muted hover:text-text-secondary hover:bg-white/5 transition-colors"
        >
          <ExternalLink className="w-3.5 h-3.5 shrink-0" />
          View site
        </Link>

        {/* User row */}
        <div className="flex items-center gap-2.5 px-3 py-2">
          <div className="w-6 h-6 rounded-full bg-accent-primary/20 border border-accent-primary/30 flex items-center justify-center shrink-0">
            <span className="font-mono text-xs font-bold text-accent-primary">
              {initials}
            </span>
          </div>
          <span className="font-mono text-xs text-text-muted truncate flex-1">
            {userEmail || "admin"}
          </span>
          <button
            onClick={handleLogout}
            title="Sign out"
            className="p-1 rounded hover:bg-rose-500/10 text-text-muted hover:text-rose-400 transition-colors shrink-0"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
}
