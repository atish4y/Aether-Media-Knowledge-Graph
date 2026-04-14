"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { search, SearchResult } from "@/lib/api";
import { MovieCard } from "@/components/dashboard/recommendations-row";
import { Film, Users, Search as SearchIcon, ArrowLeft } from "lucide-react";
import Link from "next/link";

export function SearchResultsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const query = searchParams.get("q") || "";
  
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function performSearch() {
      if (!query) return;
      setLoading(true);
      try {
        const data = await search(query);
        setResults(data.results);
      } catch (err) {
        console.error("Search error:", err);
      } finally {
        setLoading(false);
      }
    }
    performSearch();
  }, [query]);

  const movies = results.filter(r => r.type === "Movie");
  const people = results.filter(r => r.type === "Actor" || r.type === "Director");

  if (!query) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <SearchIcon className="w-12 h-12 text-muted-foreground/20 mb-4" />
        <h2 className="text-xl font-bold text-foreground">No search query</h2>
        <p className="text-muted-foreground mt-2">Enter a movie title or person name to begin.</p>
        <Link href="/" className="btn-brut px-6 py-2 mt-6 font-bold">Back to Dashboard</Link>
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-fade-up">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
             <Link href="/" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Dashboard</Link>
             <span className="text-border">/</span>
             <span className="text-xs text-foreground/60 font-semibold uppercase tracking-wider">Search</span>
          </div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight flex items-center gap-3">
             <SearchIcon className="w-7 h-7 text-muted-foreground" />
             Results for "{query}"
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
             Found {results.length} results in the knowledge graph
          </p>
        </div>
      </div>

      {loading ? (
        <div className="space-y-8">
           <div className="shimmer h-8 w-48 rounded-lg" />
           <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
             {Array.from({ length: 12 }).map((_, i) => (
               <div key={i} className="aspect-[2/3] shimmer rounded-xl" />
             ))}
           </div>
        </div>
      ) : results.length === 0 ? (
        <div className="text-center py-20 glass rounded-3xl border-dashed border-2 border-border">
          <Film className="w-12 h-12 text-muted-foreground/10 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-foreground">No matches found</h2>
          <p className="text-muted-foreground mt-2">Try searching for something else or check your spelling.</p>
        </div>
      ) : (
        <>
          {/* Movies Section */}
          {movies.length > 0 && (
            <section className="space-y-4">
              <div className="flex items-center gap-2 border-b border-border pb-3">
                <Film className="w-4 h-4 text-muted-foreground" />
                <h2 className="text-lg font-bold text-foreground">Movies ({movies.length})</h2>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
                {movies.map((res) => (
                  <MovieCard 
                    key={res.id} 
                    movie={{
                      id: res.id,
                      title: res.name,
                      year: parseInt(res.extra) || 0,
                      rating: (res.data.rating as number) || 0,
                      overview: "",
                      poster_url: res.data.poster_url as string,
                      genres: res.genres
                    }} 
                    compact 
                  />
                ))}
              </div>
            </section>
          )}

          {/* People Section */}
          {people.length > 0 && (
            <section className="space-y-4">
              <div className="flex items-center gap-2 border-b border-border pb-3">
                <Users className="w-4 h-4 text-muted-foreground" />
                <h2 className="text-lg font-bold text-foreground">People ({people.length})</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {people.map((res) => (
                  <Link 
                    key={`${res.type}-${res.id}`} 
                    href={`/person/${res.type.toLowerCase()}/${res.id}`}
                  >
                    <div className="glass hover:bg-muted group p-4 flex items-center gap-4 cursor-pointer transition-all duration-300">
                      <div className="w-12 h-12 rounded-full overflow-hidden bg-secondary border border-border shrink-0">
                         {res.data.poster_url ? (
                           <img src={res.data.poster_url as string} className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                         ) : (
                           <div className="w-full h-full flex items-center justify-center text-xs font-bold text-foreground/20">{res.name.charAt(0)}</div>
                         )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-foreground truncate group-hover:text-accent transition-colors">{res.name}</h4>
                        <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">{res.type}</p>
                        {res.sample_movies && res.sample_movies.length > 0 && (
                          <p className="text-[10px] text-muted-foreground truncate mt-1">Known for: {res.sample_movies.join(", ")}</p>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
