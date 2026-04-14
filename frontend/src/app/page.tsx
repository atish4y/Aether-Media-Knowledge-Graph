"use client";

import { useEffect, useState } from "react";
import {
  Film, Users, Clapperboard, Tag, UserCheck, BarChart3, ChevronRight, GitFork,
} from "lucide-react";
import Link from "next/link";
import { StatCard } from "@/components/dashboard/stat-card";
import { GenreChart } from "@/components/dashboard/genre-chart";
import { TimelineChart } from "@/components/dashboard/timeline-chart";
import { RecommendationsRow } from "@/components/dashboard/recommendations-row";
import { ForceGraph } from "@/components/graph/force-graph";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import {
  getOverview, getGenreDistribution, getMoviesOverTime,
  getMovies, getGraph, ingestMovie,
  OverviewStats, GenreCount, YearCount, Movie, GraphData,
} from "@/lib/api";

export default function DashboardPage() {
  const [overview, setOverview] = useState<OverviewStats | null>(null);
  const [genres, setGenres] = useState<GenreCount[]>([]);
  const [timeline, setTimeline] = useState<YearCount[]>([]);
  const [movies, setMovies] = useState<Movie[]>([]);
  const [graph, setGraph] = useState<GraphData>({ nodes: [], links: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [ov, gd, tl, mv, gr] = await Promise.all([
          getOverview(),
          getGenreDistribution(),
          getMoviesOverTime(),
          getMovies(1, 12),
          getGraph(),
        ]);
        setOverview(ov);
        setGenres(gd);
        setTimeline(tl);
        setMovies(mv.movies);
        setGraph(gr);
      } catch (err) {
        console.error("Dashboard load error:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const [ingestQuery, setIngestQuery] = useState("");
  const [ingesting, setIngesting] = useState(false);
  const [ingestMessage, setIngestMessage] = useState("");

  const handleIngest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ingestQuery.trim()) return;
    setIngesting(true);
    setIngestMessage("");
    try {
      const res = await ingestMovie(ingestQuery);
      setIngestMessage(`Success: Ingested "${res.title}" into the graph!`);
      setIngestQuery("");
      // Refresh minimal info
      getOverview().then(setOverview);
    } catch (err: any) {
      setIngestMessage("Error ingesting movie. It might already exist or not be on TMDB.");
    } finally {
      setIngesting(false);
      setTimeout(() => setIngestMessage(""), 5000);
    }
  };

  return (
    <div className="space-y-8 animate-fade-up pb-8">
      {/* Page header & Ingest Bar */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl font-bold text-foreground tracking-tight">Dashboard</h1>
            <ThemeToggle />
          </div>
          <p className="text-sm text-foreground/40 mt-1">Knowledge graph analytics at a glance</p>
        </div>
        
        <form onSubmit={handleIngest} className="relative w-full md:w-96">
          <div className="flex bg-card border border-border rounded-lg overflow-hidden focus-within:border-ring transition-colors">
            <input
              type="text"
              value={ingestQuery}
              onChange={(e) => setIngestQuery(e.target.value)}
              placeholder="Add movie from TMDB..."
              className="flex-1 bg-transparent px-3 py-2 text-sm text-foreground focus:outline-none placeholder:text-foreground/40"
              disabled={ingesting}
            />
            <button 
              type="submit" 
              disabled={!ingestQuery.trim() || ingesting}
              className="bg-foreground hover:bg-foreground/90 disabled:bg-muted text-background px-4 py-2 text-xs font-semibold transition-colors"
            >
              {ingesting ? "Fetching..." : "Ingest"}
            </button>
          </div>
          {ingestMessage && (
            <p className={`absolute -bottom-6 left-0 text-[10px] font-medium ${ingestMessage.startsWith("Success") ? "text-foreground/80" : "text-foreground/60"}`}>
              {ingestMessage}
            </p>
          )}
        </form>
      </div>

      {/* ── Section 1: Stat cards ── */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          title="Total Movies"
          value={loading ? "—" : overview?.total_movies ?? 0}
          subtitle={`${overview?.total_genres ?? 0} genres`}
          icon={<Film className="w-4 h-4" />}
          accent="white"
          loading={loading}
        />
        <StatCard
          title="Total Actors"
          value={loading ? "—" : overview?.total_actors ?? 0}
          subtitle={`${overview?.total_directors ?? 0} directors`}
          icon={<Users className="w-4 h-4" />}
          accent="white"
          loading={loading}
        />
        <StatCard
          title="Top Genre"
          value={loading ? "—" : overview?.top_genre ?? "—"}
          subtitle="Most represented"
          icon={<Tag className="w-4 h-4" />}
          accent="white"
          loading={loading}
        />
        <StatCard
          title="Most Connected"
          value={loading ? "—" : overview?.most_connected_actor ?? "—"}
          subtitle={`${overview?.most_connected_actor_count ?? 0} movies`}
          icon={<UserCheck className="w-4 h-4" />}
          accent="white"
          loading={loading}
        />
      </div>

      {/* ── Section 2: Graph Preview ── */}
      <div className="glass rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <GitFork className="w-4 h-4 text-foreground/60" />
            <h2 className="text-sm font-semibold text-foreground">Knowledge Graph Preview</h2>
            <span className="text-[10px] text-muted-foreground ml-1">{graph.nodes.length} nodes · {graph.links.length} edges</span>
          </div>
          <Link href="/graph">
            <button className="btn-brut-outline text-xs px-3 py-1.5 flex items-center gap-1.5 transition-all">
              Explore Full Graph <ChevronRight className="w-3 h-3" />
            </button>
          </Link>
        </div>
        {!loading && graph.nodes.length > 0 ? (
          <ForceGraph data={graph} height={380} compact />
        ) : (
          <div className="shimmer rounded-lg" style={{ height: 380 }} />
        )}
      </div>

      {/* ── Section 3: Charts ── */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div className="glass rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-4 h-4 text-foreground/60" />
            <h2 className="text-sm font-semibold text-foreground">Genre Distribution</h2>
          </div>
          <GenreChart data={genres} loading={loading} />
        </div>

        <div className="glass rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Film className="w-4 h-4 text-foreground/60" />
            <h2 className="text-sm font-semibold text-foreground">Movies Over Time</h2>
          </div>
          <TimelineChart data={timeline} loading={loading} />
        </div>
      </div>

      {/* ── Section 4: Recommendations / Movies ── */}
      <div className="glass rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Clapperboard className="w-4 h-4 text-foreground/60" />
            <h2 className="text-sm font-semibold text-foreground">Browse Movies</h2>
          </div>
          <Link href="/movies">
            <button className="btn-brut-outline text-xs px-3 py-1.5 flex items-center gap-1.5">
              View All <ChevronRight className="w-3 h-3" />
            </button>
          </Link>
        </div>
        <RecommendationsRow movies={movies} loading={loading} />
      </div>
    </div>
  );
}
