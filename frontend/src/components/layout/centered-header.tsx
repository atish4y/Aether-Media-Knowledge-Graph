"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import Link from "next/link";

export function CenteredHeader() {
  const [query, setQuery] = useState("");
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) router.push(`/search?q=${encodeURIComponent(query.trim())}`);
  };

  return (
    <div className="fixed top-0 left-0 right-0 z-40 flex flex-col items-center pt-8 pb-6"
         style={{ background: "rgba(0,0,0,0.95)", backdropFilter: "blur(20px)" }}>
      
      {/* Aether Logo - Centerpiece */}
      <Link href="/" className="group mb-6">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white tracking-tight">Aether</h1>
        </div>
      </Link>

      {/* Longer Search Bar */}
      <form onSubmit={handleSearch} className="relative w-full max-w-2xl">
        <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search movies, actors, directors..."
          className="w-full pl-14 pr-6 py-4 text-white bg-white/10 border border-white/20 rounded-2xl 
                     focus:outline-none focus:border-white/40 focus:bg-white/15 transition-all duration-300
                     placeholder:text-white/40 text-base"
        />
      </form>
    </div>
  );
}
