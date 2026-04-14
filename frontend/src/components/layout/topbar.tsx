"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, User } from "lucide-react";

export function Topbar() {
  const [query, setQuery] = useState("");
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) router.push(`/search?q=${encodeURIComponent(query.trim())}`);
  };

  return (
    <header className="sticky top-0 z-20 flex items-center justify-between px-6 py-3 border-b border-white/6"
      style={{ background: "rgba(13,13,13,0.8)", backdropFilter: "blur(12px)" }}>

      {/* Search */}
      <form onSubmit={handleSearch} className="relative flex-1 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search movies, actors, directors..."
          className="search-input w-full pl-9 pr-4 py-2 text-sm rounded-lg"
        />
      </form>

      {/* User */}
      <div className="flex items-center gap-3 ml-4">
        <div className="w-8 h-8 rounded-full border border-white/10 bg-white/5 flex items-center justify-center cursor-pointer hover:bg-white/10 transition-colors">
          <User className="w-4 h-4 text-white/50" />
        </div>
      </div>
    </header>
  );
}
