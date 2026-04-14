"use client";

import Link from "next/link";
import { Star, ChevronRight } from "lucide-react";
import { Movie } from "@/lib/api";

interface MovieCardProps {
  movie: Movie;
  showRating?: boolean;
  compact?: boolean;
}

function getPosterColor(id: number, genres: string[]) {
  const genreGradients: Record<string, string> = {
    "Action": "from-gray-900/80 to-black",
    "Drama": "from-gray-900/80 to-black",
    "Comedy": "from-gray-900/80 to-black",
    "Thriller": "from-gray-900/80 to-black",
  };
  const colors = [
    "from-gray-800/80 to-black",
    "from-gray-700/80 to-black",
    "from-gray-600/80 to-black",
    "from-gray-500/80 to-black",
    "from-gray-400/80 to-black",
    "from-gray-300/80 to-black",
    "from-gray-200/80 to-black",
  ];
  const genre = genres?.[0];
  if (genre && genreGradients[genre]) {
    return genreGradients[genre];
  }
  return colors[id % colors.length];
}

export function MovieCard({ movie, showRating = true, compact = false }: MovieCardProps) {
  const hasPoster = !!movie.poster_url;

  return (
    <Link href={`/movie/${movie.id}`}>
      <div className={`movie-card glass rounded-xl overflow-hidden cursor-pointer ${compact ? "w-36" : "w-44"}`}>
        {/* Poster */}
        <div className={`relative ${compact ? "h-52" : "h-64"} overflow-hidden`}>
          {hasPoster ? (
            <img
              src={movie.poster_url}
              alt={movie.title}
              className="absolute inset-0 w-full h-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className={`absolute inset-0 bg-secondary flex items-center justify-center`}>
              <span className="text-5xl font-black text-foreground/10">{movie.title.charAt(0)}</span>
            </div>
          )}
          {/* Dark overlay for readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60 dark:opacity-100" />
          {/* Rating badge */}
          {showRating && (
            <div className="absolute top-2 right-2 flex items-center gap-1 glass px-1.5 py-0.5 rounded-md z-10 shadow-sm">
              <Star className="w-2.5 h-2.5 text-amber-500 fill-amber-500" />
              <span className="text-[10px] font-bold font-mono text-foreground">{movie.rating}</span>
            </div>
          )}
          <div className="absolute bottom-2 left-3 z-10">
            {movie.genres?.slice(0, 1).map((g) => (
              <span key={g} className="badge-monochrome text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded">{g}</span>
            ))}
          </div>
        </div>
        {/* Info */}
        <div className="p-3">
          <p className="text-xs font-semibold text-foreground leading-tight line-clamp-2">{movie.title}</p>
          <p className="text-[10px] text-muted-foreground mt-1 font-mono tracking-tighter">{movie.year}</p>
        </div>
      </div>
    </Link>
  );
}

interface RecommendationsRowProps {
  movies: Movie[];
  loading?: boolean;
}

export function RecommendationsRow({ movies, loading }: RecommendationsRowProps) {
  if (loading) {
    return (
      <div className="flex gap-4 overflow-x-auto pb-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="w-44 shrink-0">
            <div className="shimmer h-64 rounded-xl mb-2" />
            <div className="shimmer h-3 w-28 rounded mb-1" />
            <div className="shimmer h-2 w-12 rounded" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex gap-4 overflow-x-auto pb-2">
      {movies.map((movie) => (
        <div key={movie.id} className="shrink-0">
          <MovieCard movie={movie} />
        </div>
      ))}
    </div>
  );
}
