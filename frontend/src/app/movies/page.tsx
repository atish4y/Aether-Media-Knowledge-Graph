"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { getMovies, Movie } from "@/lib/api";
import { MovieCard } from "@/components/dashboard/recommendations-row";
import { Film, Calendar, Tag, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";

function MoviesGridContent() {
  const searchParams = useSearchParams();
  const genre = searchParams.get("genre");
  const yearStr = searchParams.get("year");
  const year = yearStr ? parseInt(yearStr) : undefined;
  
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const data = await getMovies(page, 24, genre || undefined, year);
        setMovies(data.movies);
        setTotalPages(data.pages);
        setTotalCount(data.total);
      } catch (err) {
        console.error("Failed to load movies:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [page, genre, year]);

  return (
    <div className="space-y-6 animate-fade-up pb-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
             <Link href="/" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Dashboard</Link>
             <span className="text-muted-foreground/30">/</span>
             <span className="text-xs text-foreground/60 font-semibold uppercase tracking-wider">Gallery</span>
          </div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight flex items-center gap-3">
            <Film className="w-7 h-7 text-muted-foreground" />
            {genre ? `${genre} Movies` : year ? `Movies from ${year}` : "All Movies"}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Browse through {totalCount} movies in the knowledge graph
          </p>
        </div>

        {(genre || year) && (
          <Link href="/movies" className="text-xs bg-secondary hover:bg-muted text-foreground/70 px-3 py-1.5 rounded-lg border border-border transition-colors">
            Clear Filters
          </Link>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
        {loading ? (
          Array.from({ length: 16 }).map((_, i) => (
            <div key={i} className="aspect-[2/3] shimmer rounded-xl" />
          ))
        ) : movies.length > 0 ? (
          movies.map((m) => (
            <MovieCard key={m.id} movie={m} compact />
          ))
        ) : (
          <div className="col-span-full py-20 text-center glass rounded-2xl border-dashed border-2 border-border">
            <Film className="w-12 h-12 text-muted-foreground/10 mx-auto mb-4" />
            <p className="text-muted-foreground">No movies found matching these criteria.</p>
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 pt-8">
          <button 
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="p-2 rounded-full bg-secondary border border-border text-foreground disabled:opacity-20 hover:bg-muted transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="text-sm font-medium text-foreground/60">
            Page <span className="text-foreground">{page}</span> of {totalPages}
          </span>
          <button 
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="p-2 rounded-full bg-secondary border border-border text-foreground disabled:opacity-20 hover:bg-muted transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  );
}

export default function MoviesPage() {
  return (
    <Suspense fallback={<div className="p-8 text-muted-foreground animate-pulse">Loading gallery...</div>}>
      <MoviesGridContent />
    </Suspense>
  );
}
