"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Search } from "lucide-react";
import Link from "next/link";

export function AetherHeader() {
  const [query, setQuery] = useState("");
  const router = useRouter();
  const pathname = usePathname();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) router.push(`/search?q=${encodeURIComponent(query.trim())}`);
  };

  const isMainPage = pathname === "/";

  return (
    <div className="flex flex-col items-center pt-8 pb-6">
      <Link href="/" className="group mb-6">
        <h1 className="text-4xl branding text-foreground">Aether</h1>
      </Link>
      
      {/* Show search bar only on main page */}
      {isMainPage ? (
        <form onSubmit={handleSearch} className="relative w-full max-w-2xl">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search movies, actors, directors..."
            className="search-input w-full pl-14 pr-6 py-4 rounded-2xl transition-all duration-300 placeholder:text-muted-foreground text-base"
          />
        </form>
      ) : (
        <div className="w-full max-w-2xl h-16"></div>
      )}
    </div>
  );
}
