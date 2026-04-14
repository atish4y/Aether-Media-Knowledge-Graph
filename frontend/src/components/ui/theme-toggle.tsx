"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/contexts/theme-context";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="relative inline-flex h-6 w-11 items-center rounded-full border border-foreground/10 bg-muted/20 transition-all hover:border-foreground/20 focus:outline-none"
      role="switch"
      aria-checked={theme === "light"}
    >
      <span className="sr-only">Toggle theme</span>
      
      {/* Slider Circle */}
      <div
        className={`flex h-5 w-5 items-center justify-center rounded-full bg-foreground shadow-sm transition-all duration-300 ${
          theme === "light" ? "translate-x-[21px]" : "translate-x-[1px]"
        }`}
      >
        {theme === "light" ? (
          <Sun className="h-3 w-3 text-background" />
        ) : (
          <Moon className="h-3 w-3 text-background" />
        )}
      </div>
    </button>
  );
}

