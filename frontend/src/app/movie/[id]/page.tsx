"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
  getMovie, getMovieSubgraph, getRecommendations,
  MovieDetail, GraphData, Recommendation
} from "@/lib/api";
import { ForceGraph } from "@/components/graph/force-graph";
import { RecommendationsRow } from "@/components/dashboard/recommendations-row";
import { ArrowLeft, Star, Clapperboard, GitFork, Sparkles } from "lucide-react";

export default function MoviePage() {
  const { id } = useParams();
  const router = useRouter();
  const movieId = parseInt(id as string, 10);

  const [detail, setDetail] = useState<MovieDetail | null>(null);
  const [subgraph, setSubgraph] = useState<GraphData | null>(null);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!movieId) return;
    async function load() {
      try {
        const [det, sub, rec] = await Promise.all([
          getMovie(movieId),
          getMovieSubgraph(movieId),
          getRecommendations(movieId)
        ]);
        setDetail(det);
        setSubgraph(sub);
        setRecommendations(rec.recommendations);
      } catch (err) {
        console.error("Movie load error:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [movieId]);

  if (loading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="h-10 w-32 bg-muted rounded-lg"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-1 h-[400px] bg-muted rounded-xl"></div>
          <div className="md:col-span-2 space-y-4">
            <div className="h-12 w-3/4 bg-muted rounded"></div>
            <div className="h-6 w-1/4 bg-muted rounded"></div>
            <div className="h-24 bg-muted rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center">
        <h1 className="text-2xl font-bold text-foreground mb-2">Movie Not Found</h1>
        <button onClick={() => router.back()} className="btn-brut px-4 py-2 mt-4 font-bold">
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-up pb-8">
      {/* Back button */}
      <button 
        onClick={() => router.back()} 
        className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-sm font-medium"
      >
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      {/* Main Info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Poster */}
        <div className="md:col-span-1">
          <div className="glass rounded-xl h-[450px] relative overflow-hidden flex items-end p-6 border-border">
            {detail.movie.poster_url ? (
              <img
                src={detail.movie.poster_url}
                alt={detail.movie.title}
                className="absolute inset-0 w-full h-full object-cover"
              />
            ) : (
              <div className="absolute inset-0 bg-secondary flex items-center justify-center">
                <span className="text-9xl font-black text-foreground/10">{detail.movie.title.charAt(0)}</span>
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
            <div className="relative z-10 w-full space-y-3">
              <div className="flex gap-2 flex-wrap">
                {detail.genres.map(g => (
                  <span key={g.name} className="badge-monochrome">{g.name}</span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Details */}
        <div className="md:col-span-2 flex flex-col justify-center">
          <h1 className="text-4xl md:text-5xl font-black text-foreground tracking-tight leading-tight">
            {detail.movie.title}
          </h1>
          
          <div className="flex items-center gap-4 mt-4 text-sm font-medium">
            <span className="text-muted-foreground bg-muted px-2 py-1 rounded-md">{detail.movie.year}</span>
            <div className="flex items-center gap-1.5 text-foreground/80 bg-secondary px-2 py-1 rounded-md border border-border bg-card">
              <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
              {detail.movie.rating}
            </div>
          </div>

          <p className="text-lg text-foreground/70 mt-6 leading-relaxed">
            {detail.movie.overview}
          </p>

          <div className="mt-8 grid grid-cols-2 gap-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/60 mb-2">Director</p>
              <div className="flex flex-wrap gap-2">
                {detail.directors.map(d => (
                  <span key={d.id} className="text-sm font-medium text-foreground/90">{d.name}</span>
                ))}
              </div>
            </div>
            <div>
               <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/60 mb-2">Top Cast</p>
               <div className="flex flex-col gap-1.5 max-h-32 overflow-y-auto">
                 {detail.actors.slice(0, 5).map(a => (
                   <span key={a.id} className="text-sm font-medium text-foreground/80">• {a.name}</span>
                 ))}
                 {detail.actors.length > 5 && (
                   <span className="text-[10px] text-muted-foreground mt-1">+{detail.actors.length - 5} more</span>
                 )}
               </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        
        {/* Relationship Graph Preview */}
        <div className="glass rounded-xl p-5 border-t-2 border-t-accent shadow-sm">
           <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <GitFork className="w-4 h-4 text-muted-foreground" />
              <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">Entity Network</h2>
            </div>
            <span className="text-[10px] text-muted-foreground px-2 py-1 bg-muted rounded">1-Hop Subgraph</span>
          </div>
          {subgraph && <ForceGraph data={subgraph} height={350} compact />}
        </div>

        {/* Similar Movies */}
        <div className="glass rounded-xl p-5 border-t-2 border-t-accent flex flex-col shadow-sm">
           <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-4 h-4 text-muted-foreground" />
              <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">Similar Movies</h2>
           </div>
           
           <div className="flex-1 overflow-y-auto pr-2 space-y-3">
             {recommendations.length > 0 ? recommendations.slice(0, 5).map((rec, i) => (
                <div key={rec.movie.id} onClick={() => router.push(`/movie/${rec.movie.id}`)} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border cursor-pointer hover:bg-muted/60 transition-colors">
                  <div>
                    <h4 className="font-bold text-foreground mb-0.5">{rec.movie.title}</h4>
                    <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                      {rec.shared_genres.length > 0 && (
                        <span><span className="text-foreground/60 font-semibold">{rec.shared_genres.length}</span> shared genres</span>
                      )}
                      {rec.shared_actors.length > 0 && (
                        <span><span className="text-foreground/80 font-semibold">{rec.shared_actors.length}</span> shared actors</span>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-[10px] uppercase text-muted-foreground/60 font-semibold mb-0.5">Match Score</span>
                    <span className="text-sm font-black text-foreground/60">{rec.score}</span>
                  </div>
                </div>
             )) : (
               <div className="h-full flex items-center justify-center text-sm text-dim">
                 No strong connections found.
               </div>
             )}
           </div>
        </div>

      </div>
    </div>
  );
}
