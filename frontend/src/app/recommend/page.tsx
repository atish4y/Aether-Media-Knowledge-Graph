"use client";

import { useState } from "react";
import { getSmartRecommendations, Recommendation, SearchResult, search } from "@/lib/api";
import { Sparkles, Search as SearchIcon, X, Film, CheckCircle2 } from "lucide-react";
import { MovieCard } from "@/components/dashboard/recommendations-row";

export default function RecommendPage() {
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedMovies, setSelectedMovies] = useState<SearchResult[]>([]);
  
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loadingRecs, setLoadingRecs] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    try {
      const res = await search(query);
      // Only keep movies
      setSearchResults(res.results.filter(r => r.type === "Movie"));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const toggleMovie = (movie: SearchResult) => {
    if (selectedMovies.find(m => m.id === movie.id)) {
      setSelectedMovies(selectedMovies.filter(m => m.id !== movie.id));
    } else {
      if (selectedMovies.length >= 5) return; // limit to 5
      setSelectedMovies([...selectedMovies, movie]);
    }
    setQuery("");
    setSearchResults([]);
  };

  const getRecs = async () => {
    if (selectedMovies.length === 0) return;
    setLoadingRecs(true);
    try {
      const ids = selectedMovies.map(m => m.id);
      const res = await getSmartRecommendations(ids, 12);
      setRecommendations(res.recommendations);
    } catch (err) {
      console.error("Recs error", err);
    } finally {
      setLoadingRecs(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fade-up pb-8 pt-4">
      <div className="text-center space-y-3">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-secondary text-foreground/60 mb-2 border border-border">
          <Sparkles className="w-6 h-6" />
        </div>
        <h1 className="text-3xl font-bold text-foreground tracking-tight">AI Recommender</h1>
        <p className="text-sm text-dim max-w-lg mx-auto">
          Build a taste profile by selecting up to 5 movies you love. 
          Our graph algorithm will traverse the relationships to find the perfect matches.
        </p>
      </div>

      <div className="glass rounded-xl p-6 border-t-2 border-accent max-w-3xl mx-auto">
        <form onSubmit={handleSearch} className="relative mb-6">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search for a movie..."
            className="w-full bg-muted/50 border border-border rounded-lg py-3 pl-11 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-foreground/40 transition-colors"
          />
          <SearchIcon className="absolute left-4 top-3.5 w-4 h-4 text-muted-foreground" />
          <button type="submit" className="hidden" />
          
          {/* Search Dropdown */}
          {searchResults.length > 0 && query && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-lg shadow-xl z-20 max-h-60 overflow-y-auto">
              {searchResults.map(res => (
                <div 
                  key={res.id} 
                  onClick={() => toggleMovie(res)}
                  className="flex items-center gap-3 p-3 hover:bg-muted cursor-pointer border-b border-border last:border-0"
                >
                  <div className="w-8 h-12 bg-muted rounded flex items-center justify-center shrink-0">
                    <Film className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-foreground">{res.name}</h4>
                    <p className="text-xs text-muted-foreground">{res.extra}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </form>

        <div className="flex flex-wrap gap-3 mb-6">
          {selectedMovies.map(m => (
            <div key={m.id} className="flex items-center gap-2 pl-3 pr-2 py-1.5 bg-amber-500/10 border border-amber-500/30 rounded-full">
              <span className="text-sm font-medium text-foreground/80">{m.name}</span>
              <button 
                onClick={() => toggleMovie(m)}
                className="w-5 h-5 flex items-center justify-center rounded-full hover:bg-white/20 dark:hover:bg-white/10 text-muted-foreground transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
          {selectedMovies.length === 0 && (
            <div className="text-sm text-dim py-2 border border-dashed border-border rounded-full px-4">
              No movies selected yet
            </div>
          )}
        </div>

        <button 
          onClick={getRecs} 
          disabled={selectedMovies.length === 0 || loadingRecs}
          className="w-full py-3 bg-foreground hover:bg-foreground/90 disabled:bg-muted text-background font-bold rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          {loadingRecs ? (
            <><div className="w-4 h-4 border-2 border-muted-foreground border-t-background rounded-full animate-spin" /> Analyzing Graph...</>
          ) : (
            <><Sparkles className="w-4 h-4" /> Get Graph Recommendations</>
          )}
        </button>
      </div>

      {recommendations.length > 0 && (
        <div className="space-y-6 pt-4">
          <div className="flex items-center gap-2 border-b border-border pb-4">
            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
            <h2 className="text-xl font-bold text-foreground tracking-tight">Your Graph Matches</h2>
            <span className="text-sm font-medium text-dim ml-auto">{recommendations.length} results</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recommendations.map(rec => (
              <div key={rec.movie.id} className="glass rounded-xl p-4 flex gap-4">
                <div className="shrink-0 flex items-center">
                   <MovieCard movie={{...rec.movie, overview: "", rating: rec.movie.rating}} compact />
                </div>
                
                <div className="flex flex-col flex-1 min-w-0 py-1">
                  <div className="mb-auto">
                    <div className="flex items-center gap-2 mb-2">
                       <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                         {rec.score}% MATCH
                       </span>
                    </div>
                    {rec.because_you_liked && rec.because_you_liked.length > 0 && (
                      <p className="text-[10px] text-muted-foreground leading-tight mb-2">
                        Because you liked <span className="text-foreground/70 font-semibold">{rec.because_you_liked.join(", ")}</span>
                      </p>
                    )}
                  </div>

                  <div className="space-y-1.5 mt-2">
                    {rec.shared_genres.length > 0 && (
                      <div className="text-[10px]"><span className="text-muted-foreground">GENRES:</span> <span className="text-foreground/80">{rec.shared_genres.slice(0,3).join(", ")}</span></div>
                    )}
                    {rec.shared_actors.length > 0 && (
                      <div className="text-[10px]"><span className="text-muted-foreground">ACTORS:</span> <span className="text-foreground/80">{rec.shared_actors.slice(0,2).join(", ")}</span></div>
                    )}
                    {rec.shared_directors && rec.shared_directors.length > 0 && (
                      <div className="text-[10px]"><span className="text-muted-foreground">DIRECTOR:</span> <span className="text-foreground/80">{rec.shared_directors.slice(0,1).join(", ")}</span></div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
