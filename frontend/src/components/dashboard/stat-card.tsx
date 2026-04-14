"use client";

import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: ReactNode;
  accent?: "blue" | "green" | "purple" | "amber" | "white";
  loading?: boolean;
}

const accentMap = {
  blue: "border-l-blue-500",
  green: "border-l-green-500",
  purple: "border-l-purple-500",
  amber: "border-l-amber-500",
  white: "border-l-foreground",
};

const iconBgMap = {
  blue: "bg-blue-500/10 text-blue-500",
  green: "bg-green-500/10 text-green-500",
  purple: "bg-purple-500/10 text-purple-500",
  amber: "bg-amber-500/10 text-amber-500",
  white: "bg-foreground/10 text-foreground",
};

export function StatCard({ title, value, subtitle, icon, accent = "blue", loading }: StatCardProps) {
  const accentClass = accentMap[accent] || "border-l-blue-500";

  if (loading) {
    return (
      <div className={cn("glass p-5 rounded-xl border-l-[3px]", accentClass)}>
        <div className="shimmer h-4 w-24 rounded mb-3" />
        <div className="shimmer h-8 w-16 rounded mb-2" />
        <div className="shimmer h-3 w-28 rounded" />
      </div>
    );
  }

  return (
    <div className={cn("glass p-5 rounded-xl animate-fade-up group hover:bg-muted/50 transition-colors border-l-[3px]", accentClass)}>
      <div className="flex items-start justify-between mb-3">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-[0.1em]">{title}</p>
        <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", iconBgMap[accent])}>
          {icon}
        </div>
      </div>
      <p className="text-3xl font-bold font-mono tracking-tighter text-foreground">{value}</p>
      {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
    </div>
  );
}
