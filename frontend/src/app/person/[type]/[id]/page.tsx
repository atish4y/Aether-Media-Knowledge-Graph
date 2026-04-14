"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getPersonDetails, PersonDetails } from "@/lib/api";
import { Film, Star, Calendar, Users } from "lucide-react";
import Link from "next/link";
import { MovieCard } from "@/components/dashboard/recommendations-row";

export default function PersonPage() {
  const params = useParams();
  const type = params.type as "actor" | "director";
  const id = parseInt(params.id as string, 10);
  
  const [data, setData] = useState<PersonDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!type || !id || isNaN(id)) return;
      try {
        const details = await getPersonDetails(type, id);
        setData(details);
      } catch (err) {
        console.error("Failed to load person:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [type, id]);

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="shimmer h-48 rounded-xl w-full" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <div key={i} className="shimmer h-24 rounded-xl" />)}
        </div>
      </div>
    );
  }

  if (!data) {
    return <div className="text-muted-foreground p-8 text-center bg-muted rounded-xl">Person not found</div>;
  }

  const { person, filmography, stats, collaborators } = data;

  return (
    <div className="space-y-8 animate-fade-up pb-8">
      {/* Header */}
      <div className="glass rounded-xl p-8 flex flex-col md:flex-row gap-8 items-center md:items-start relative overflow-hidden">
        {/* Background Blur */}
        <div 
          className="absolute inset-0 opacity-10 blur-3xl pointer-events-none"
          style={{
            backgroundImage: person.poster_url ? `url(${person.poster_url})` : 'none',
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        />
        
        <div className="w-40 h-40 rounded-full overflow-hidden shrink-0 border-4 border-border relative z-10 bg-secondary flex items-center justify-center">
          {person.poster_url ? (
             <img src={person.poster_url} alt={person.name} className="w-full h-full object-cover" />
          ) : (
             <span className="text-5xl font-black text-foreground/20">{person.name.charAt(0)}</span>
          )}
        </div>
        
        <div className="flex-1 text-center md:text-left relative z-10 pt-2">
          <div className="inline-block px-3 py-1 bg-secondary rounded-full text-xs font-semibold uppercase tracking-wider text-foreground/70 mb-3 border border-border">
            {person.type}
          </div>
          <h1 className="text-4xl font-bold text-foreground tracking-tight mb-6">{person.name}</h1>
          
          <div className="flex flex-wrap gap-6 justify-center md:justify-start">
            <div className="flex flex-col">
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground uppercase tracking-widest font-semibold mb-1"><Film className="w-3.5 h-3.5"/> Movies</span>
              <span className="text-xl font-bold text-foreground">{stats.total_movies}</span>
            </div>
            <div className="flex flex-col">
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground uppercase tracking-widest font-semibold mb-1"><Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500"/> Avg Rating</span>
              <span className="text-xl font-bold text-foreground">{stats.avg_rating}</span>
            </div>
            <div className="flex flex-col">
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground uppercase tracking-widest font-semibold mb-1"><Calendar className="w-3.5 h-3.5"/> Active Years</span>
              <span className="text-xl font-bold text-foreground">{stats.year_range}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
        {/* Left Column: Filmography */}
        <div className="xl:col-span-3 space-y-6">
          <div className="flex items-center gap-2 mb-4">
            <Film className="w-5 h-5 text-muted-foreground" />
            <h2 className="text-xl font-bold text-foreground">Filmography</h2>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {filmography.map(movie => (
              <MovieCard 
                key={movie.id} 
                movie={{...movie, overview: "", rating: movie.rating}} 
                compact 
              />
            ))}
          </div>
        </div>

        {/* Right Column: Sidebar */}
        <div className="space-y-6">
          <div className="glass rounded-xl p-5 border-t-2 border-t-emerald-500 shadow-sm">
             <div className="flex items-center gap-2 mb-4">
              <Star className="w-4 h-4 text-emerald-500" />
              <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">Top Genres</h3>
            </div>
            <div className="space-y-3">
              {stats.top_genres.map(g => (
                <div key={g.genre} className="flex items-center justify-between">
                  <span className="text-sm text-foreground/80">{g.genre}</span>
                  <span className="text-xs font-semibold px-2 py-0.5 bg-muted rounded border border-border">{g.count}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="glass rounded-xl p-5 border-t-2 border-t-accent shadow-sm">
             <div className="flex items-center gap-2 mb-4">
              <Users className="w-4 h-4 text-muted-foreground" />
              <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">Top Collaborators</h3>
            </div>
            <div className="space-y-4">
              {collaborators.map(c => (
                <Link key={c.id} href={`/person/${person.type === 'actor' ? 'actor' : 'director'}/${c.id}`}>
                  <div className="flex items-center gap-3 p-2 -mx-2 rounded-lg hover:bg-muted transition-colors cursor-pointer group">
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-muted shrink-0 border border-border">
                      {c.poster_url ? (
                        <img src={c.poster_url} className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs font-bold text-foreground/20">{c.name.charAt(0)}</div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{c.name}</p>
                      <p className="text-xs text-muted-foreground">{c.shared_movies} shared movies</p>
                    </div>
                  </div>
                </Link>
              ))}
              {collaborators.length === 0 && (
                <p className="text-sm text-dim">No major collaborations found.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
