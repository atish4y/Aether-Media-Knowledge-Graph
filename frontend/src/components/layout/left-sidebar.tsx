"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  GitFork,
  BarChart3,
  Clapperboard,
  Sparkles,
  TrendingUp,
  Film
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/graph", label: "Graph View", icon: GitFork },
  { href: "/recommend", label: "Recommend", icon: Sparkles },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/movies", label: "Movies", icon: Film },
];

export function LeftSidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 h-full w-72 z-30 flex flex-col border-r border-border" style={{ background: "var(--sidebar-bg)" }}>
      
      {/* Navigation Header */}
      <div className="px-6 py-8 border-b border-border">
        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.15em] mb-4">
          Navigation
        </p>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 px-4 py-2">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== "/" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "group flex items-center gap-4 px-4 py-3.5 rounded-xl text-sm font-medium transition-all duration-200 mb-1",
                active 
                  ? "nav-item-active" 
                  : "nav-item-idle"
              )}
            >
              <Icon className={cn(
                "w-5 h-5 transition-colors",
                active ? "text-inherit" : "text-muted-foreground group-hover:text-foreground"
              )} />
              <span className={active ? "font-semibold" : ""}>{label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-6 py-6 border-t border-border">
        <div className="space-y-2">
          <p className="text-[10px] text-muted-foreground uppercase tracking-[0.15em]">System</p>
          <p className="text-xs text-muted-foreground font-medium">Media Knowledge Graph</p>
          <p className="text-[10px] text-muted-foreground/60">Powered by Neo4j</p>
        </div>
      </div>
    </aside>
  );
}
