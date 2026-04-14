"use client";

import { useEffect, useState } from "react";
import { BarChart3, Users, Star, Award, Network, ChevronRight, Activity } from "lucide-react";
import { GenreChart } from "@/components/dashboard/genre-chart";
import { TimelineChart } from "@/components/dashboard/timeline-chart";
import Link from "next/link";
import {
  getTopActors, getGenreDistribution, getMoviesOverTime, getOverview,
  getGraphStats, getDirectorRankings, getCollaborations,
  TopActor, GenreCount, YearCount, OverviewStats
} from "@/lib/api";

export default function AnalyticsPage() {
  const [topActors, setTopActors] = useState<TopActor[]>([]);
  const [genres, setGenres] = useState<GenreCount[]>([]);
  const [timeline, setTimeline] = useState<YearCount[]>([]);
  const [overview, setOverview] = useState<OverviewStats | null>(null);
  const [graphStats, setGraphStats] = useState<any>(null);
  const [directors, setDirectors] = useState<any[]>([]);
  const [collabs, setCollabs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [ta, gd, tl, ov, gs, dr, cl] = await Promise.all([
          getTopActors(10),
          getGenreDistribution(),
          getMoviesOverTime(),
          getOverview(),
          getGraphStats(),
          getDirectorRankings(10),
          getCollaborations(10)
        ]);
        setTopActors(ta);
        setGenres(gd);
        setTimeline(tl);
        setOverview(ov);
        setGraphStats(gs);
        setDirectors(dr);
        setCollabs(cl);
      } catch (err) {
        console.error("Analytics load error:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="space-y-8 animate-fade-up pb-8 pt-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-emerald-500" />
            Analytics Deep Dive
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Detailed statistics and knowledge graph insights</p>
        </div>
        
        {/* Network Graph Stats Banner */}
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-5 py-3 flex gap-6">
          <div>
            <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-wider mb-0.5">Network Density</p>
            <p className="text-lg font-bold text-foreground leading-none">{loading ? "-" : (graphStats?.density ?? 0)}</p>
          </div>
          <div className="w-px bg-border" />
          <div>
            <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-wider mb-0.5">Avg Degree</p>
            <p className="text-lg font-bold text-foreground leading-none">{loading ? "-" : (graphStats?.avg_degree ?? 0)}</p>
          </div>
          <div className="w-px bg-border" />
          <div>
            <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-wider mb-0.5">Edges</p>
            <p className="text-lg font-bold text-foreground leading-none">{loading ? "-" : (graphStats?.total_edges ?? 0)}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left column: Leaders & Collaborations */}
        <div className="xl:col-span-1 space-y-6">
          <div className="glass rounded-xl p-5 border-t-2 border-t-amber-500">
            <div className="flex items-center gap-2 mb-4">
              <Star className="w-4 h-4 text-amber-500" />
              <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">Top Directors by Rating</h2>
            </div>
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map(i => <div key={i} className="h-10 shimmer rounded" />)}
              </div>
            ) : (
              <div className="space-y-2">
                {directors.map((dir, i) => (
                  <Link key={dir.name} href={`/person/director/${dir.id}`}>
                    <div className="flex flex-row items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-bold text-muted-foreground w-4">{i + 1}</span>
                        <div className="w-6 h-6 rounded bg-muted overflow-hidden shrink-0 border border-border">
                          {dir.poster_url && <img src={dir.poster_url} className="w-full h-full object-cover" />}
                        </div>
                        <span className="text-sm font-medium text-foreground truncate max-w-[120px]">{dir.name}</span>
                      </div>
                      <span className="text-xs font-semibold px-2 py-1 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-md border border-amber-500/20">
                        {dir.avg_rating} <Star className="w-2.5 h-2.5 inline relative -top-[1px] ml-0.5" />
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          <div className="glass rounded-xl p-5 border-t-2 border-t-blue-500">
            <div className="flex items-center gap-2 mb-4">
              <Users className="w-4 h-4 text-blue-500" />
              <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">Most Active Actors</h2>
            </div>
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map(i => <div key={i} className="h-10 shimmer rounded" />)}
              </div>
            ) : (
              <div className="space-y-2">
                {topActors.map((actor, i) => (
                  <Link key={actor.name} href={`/person/actor/${actor.id}`}>
                    <div className="flex flex-row items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-bold text-muted-foreground w-4">{i + 1}</span>
                        <div className="w-6 h-6 rounded bg-muted overflow-hidden shrink-0 border border-border">
                          {actor.poster_url && <img src={actor.poster_url} className="w-full h-full object-cover" />}
                        </div>
                        <span className="text-sm font-medium text-foreground truncate max-w-[120px]">{actor.name}</span>
                      </div>
                      <span className="text-xs font-semibold px-2 py-1 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-md border border-blue-500/20">
                        {actor.movie_count} movies
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right column: Charts & Network */}
        <div className="xl:col-span-2 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="glass rounded-xl p-5">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase mb-2">Most Connected Actor</h3>
              <p className="text-2xl font-bold text-foreground flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-500" />
                {loading ? "..." : overview?.most_connected_actor}
              </p>
            </div>
            <div className="glass rounded-xl p-5">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase mb-2">Dominant Genre</h3>
              <p className="text-2xl font-bold text-foreground flex items-center gap-2">
                <Activity className="w-5 h-5 text-emerald-500" />
                {loading ? "..." : overview?.top_genre}
              </p>
            </div>
          </div>

          <div className="glass rounded-xl p-5 border-t-2 border-t-rose-500">
            <div className="flex items-center gap-2 mb-4">
              <Network className="w-4 h-4 text-rose-500" />
              <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">Top Actor Collaborations</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {loading ? (
                [1,2,3,4].map(i => <div key={i} className="h-16 shimmer rounded border border-border" />)
              ) : (
                collabs.map((c, i) => (
                  <div key={i} className="p-3 bg-muted/30 border border-border rounded-lg flex items-center justify-between group hover:bg-muted/50 transition-colors">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-bold text-foreground">{c.actor1}</span>
                        <span className="text-muted-foreground text-xs text-center">&</span>
                        <span className="text-sm font-bold text-foreground">{c.actor2}</span>
                      </div>
                      <p className="text-[10px] text-muted-foreground truncate max-w-[200px]">{c.movie_titles.join(", ")}</p>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center font-bold text-sm border border-rose-500/20">
                      {c.shared_movies}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="glass rounded-xl p-5 border-t-2 border-t-emerald-500">
             <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="w-4 h-4 text-emerald-500" />
              <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">Genre Distribution</h2>
            </div>
            <GenreChart data={genres} loading={loading} />
          </div>

          <div className="glass rounded-xl p-5 border-t-2 border-t-purple-500">
             <div className="flex items-center gap-2 mb-4">
              <Activity className="w-4 h-4 text-purple-500" />
              <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">Releases Over Time</h2>
            </div>
            <TimelineChart data={timeline} loading={loading} />
          </div>
        </div>
      </div>
    </div>
  );
}
