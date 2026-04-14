const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

async function fetcher<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  if (!res.ok) throw new Error(`API error ${res.status}: ${path}`);
  return res.json();
}

// ─── Movies ────────────────────────────────────────────────────────────
export interface Movie {
  id: number;
  title: string;
  year: number;
  rating: number;
  overview: string;
  poster_url?: string;
  genres?: string[];
}

export interface MovieDetail {
  movie: Movie;
  actors: { id: number; name: string }[];
  directors: { id: number; name: string }[];
  genres: { name: string }[];
}

export async function getMovies(page = 1, limit = 20, genre?: string, year?: number) {
  let url = `/api/movies?page=${page}&limit=${limit}`;
  if (genre) url += `&genre=${encodeURIComponent(genre)}`;
  if (year) url += `&year=${year}`;
  
  return fetcher<{
    movies: Movie[];
    total: number;
    page: number;
    pages: number;
  }>(url);
}

export async function getMovie(id: number) {
  return fetcher<MovieDetail>(`/api/movies/${id}`);
}

// ─── Graph ─────────────────────────────────────────────────────────────
export interface GraphNode {
  id: string;
  label: string;
  type: string;
  properties: Record<string, unknown>;
  poster_url?: string;
}

export interface GraphLink {
  source: string;
  target: string;
  type: string;
}

export interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}

export interface GraphFilterParams {
  types?: string[];
  min_rating?: number;
  max_rating?: number;
  year_from?: number;
  year_to?: number;
  genre?: string;
}

export async function getGraph(params?: GraphFilterParams) {
  let url = "/api/graph";
  if (params) {
    const searchParams = new URLSearchParams();
    if (params.types?.length) searchParams.append("types", params.types.join(","));
    if (params.min_rating) searchParams.append("min_rating", params.min_rating.toString());
    if (params.max_rating) searchParams.append("max_rating", params.max_rating.toString());
    if (params.year_from) searchParams.append("year_from", params.year_from.toString());
    if (params.year_to) searchParams.append("year_to", params.year_to.toString());
    if (params.genre) searchParams.append("genre", params.genre);
    const q = searchParams.toString();
    if (q) url += `?${q}`;
  }
  return fetcher<GraphData>(url);
}

export async function getMovieSubgraph(movieId: number) {
  return fetcher<GraphData>(`/api/graph/movie/${movieId}`);
}

export async function findPath(fromId: string, toId: string) {
  return fetcher<{ nodes: GraphNode[]; links: GraphLink[]; path_length: number }>(`/api/graph/path?from=${encodeURIComponent(fromId)}&to=${encodeURIComponent(toId)}`);
}

export async function getAllNodes() {
  return fetcher<{ id: string; label: string; type: string }[]>("/api/graph/nodes");
}

export interface PersonDetails {
  person: {
    id: number;
    name: string;
    type: string;
    poster_url?: string;
  };
  filmography: {
    id: number;
    title: string;
    year: number;
    rating: number;
    poster_url?: string;
    genres: string[];
  }[];
  stats: {
    total_movies: number;
    avg_rating: number;
    year_range: string;
    top_genres: { genre: string; count: number }[];
  };
  collaborators: {
    id: number;
    name: string;
    poster_url?: string;
    shared_movies: number;
    movie_titles: string[];
  }[];
}

export async function getPersonDetails(type: "actor" | "director", id: number) {
  return fetcher<PersonDetails>(`/api/graph/person/${type}/${id}`);
}

// ─── Analytics ─────────────────────────────────────────────────────────
export interface OverviewStats {
  total_movies: number;
  total_actors: number;
  total_directors: number;
  total_genres: number;
  top_genre: string;
  most_connected_actor: string;
  most_connected_actor_count: number;
}

export interface TopActor {
  id: number;
  name: string;
  poster_url?: string;
  movie_count: number;
}

export interface GenreCount {
  genre: string;
  count: number;
}

export interface YearCount {
  year: number;
  count: number;
}

export async function getOverview() {
  return fetcher<OverviewStats>("/api/analytics/overview");
}

export async function getTopActors(limit = 10) {
  return fetcher<TopActor[]>(`/api/analytics/top-actors?limit=${limit}`);
}

export async function getGenreDistribution() {
  return fetcher<GenreCount[]>("/api/analytics/genre-distribution");
}

export async function getMoviesOverTime() {
  return fetcher<YearCount[]>("/api/analytics/movies-over-time");
}

export async function getGraphStats() {
  return fetcher<{total_nodes: number; total_edges: number; avg_degree: number; max_degree: number; density: number}>("/api/analytics/graph-stats");
}

export async function getDirectorRankings(limit = 15) {
  return fetcher<{id: number; name: string; poster_url?: string; movie_count: number; avg_rating: number; movies: string[]}[]>(`/api/analytics/director-rankings?limit=${limit}`);
}

export async function getCollaborations(limit = 20) {
  return fetcher<{actor1: string; actor2: string; shared_movies: number; movie_titles: string[]}[]>(`/api/analytics/collaborations?limit=${limit}`);
}

// ─── Recommendations ───────────────────────────────────────────────────
export interface Recommendation {
  movie: Movie;
  score: number;
  shared_genres: string[];
  shared_actors: string[];
  shared_directors?: string[];
  because_you_liked?: string[];
}

export async function getRecommendations(movieId: number, limit = 10) {
  return fetcher<{ movie_id: number; recommendations: Recommendation[] }>(
    `/api/recommendations/${movieId}?limit=${limit}`
  );
}

export async function getSmartRecommendations(movieIds: number[], limit = 10) {
  return fetcher<{ input_movie_ids: number[]; recommendations: Recommendation[] }>(
    `/api/recommendations/smart`,
    {
      method: "POST",
      body: JSON.stringify({ movie_ids: movieIds, limit }),
    }
  );
}

// ─── Search ────────────────────────────────────────────────────────────
export interface SearchResult {
  type: "Movie" | "Actor" | "Director";
  id: number;
  name: string;
  extra: string;
  genres?: string[];
  sample_movies?: string[];
  data: Record<string, unknown>;
}

export async function search(q: string, semantic: boolean = false) {
  const endpoint = semantic ? "/api/search/semantic" : "/api/search";
  return fetcher<{ results: SearchResult[]; total: number; query: string }>(
    `${endpoint}?q=${encodeURIComponent(q)}`
  );
}

export async function ingestMovie(title: string) {
  return fetcher<{ message: string; title: string; id: number }>(`/api/movies/ingest?title=${encodeURIComponent(title)}`, {
    method: "POST"
  });
}

// ─── Health ────────────────────────────────────────────────────────────
export async function getHealth() {
  return fetcher<{ status: string; neo4j: string }>("/api/health");
}
