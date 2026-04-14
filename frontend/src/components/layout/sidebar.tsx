"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  GitFork,
  BarChart3,
  Search,
  Clapperboard,
  Sparkles
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/graph", label: "Graph View", icon: GitFork },
  { href: "/recommend", label: "Recommend", icon: Sparkles },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/search", label: "Search", icon: Search },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 h-full w-64 z-30 flex flex-col border-r border-border"
      style={{ background: "var(--sidebar-bg)" }}>

      {/* Logo */}
      <div className="px-5 py-6 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-card border border-border">
            <Clapperboard className="w-5 h-5 text-foreground/60" />
          </div>
          <div>
            <p className="text-sm font-800 text-foreground leading-tight tracking-tight">Aether</p>
            <p className="text-xs font-semibold text-muted-foreground leading-tight tracking-[0.08em] uppercase">Knowledge Graph</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.12em] px-3 mb-3">
          Navigation
        </p>
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== "/" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "nav-item flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium w-full transition-all",
                active ? "nav-active" : "text-muted-foreground"
              )}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-5 py-4 border-t border-white/6">
        <p className="text-[10px] text-muted-foreground/60">v1.0 · Neo4j + FastAPI</p>
      </div>
    </aside>
  );
}
