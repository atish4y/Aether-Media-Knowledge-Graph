from pydantic import BaseModel
from typing import Optional


# --- Core entities ---

class Movie(BaseModel):
    id: int
    title: str
    year: int
    rating: float
    overview: str
    poster_url: str | None = None


class Actor(BaseModel):
    id: int
    name: str


class Director(BaseModel):
    id: int
    name: str


class Genre(BaseModel):
    id: int
    name: str


# --- Movie with relationships ---

class MovieDetail(BaseModel):
    movie: Movie
    actors: list[Actor] = []
    directors: list[Director] = []
    genres: list[Genre] = []


# --- Graph visualization ---

class GraphNode(BaseModel):
    id: str
    label: str
    type: str  # "Movie", "Actor", "Director", "Genre"
    properties: dict = {}


class GraphEdge(BaseModel):
    source: str
    target: str
    type: str  # "ACTED_IN", "DIRECTED", "BELONGS_TO"


class GraphData(BaseModel):
    nodes: list[GraphNode]
    links: list[GraphEdge]


# --- Analytics ---

class TopActor(BaseModel):
    name: str
    movie_count: int


class GenreCount(BaseModel):
    genre: str
    count: int


class YearCount(BaseModel):
    year: int
    count: int


class OverviewStats(BaseModel):
    total_movies: int
    total_actors: int
    total_directors: int
    total_genres: int
    top_genre: str
    most_connected_actor: str
    most_connected_actor_count: int


class AnalyticsResponse(BaseModel):
    overview: OverviewStats
    top_actors: list[TopActor]
    genre_distribution: list[GenreCount]
    movies_over_time: list[YearCount]


# --- Recommendations ---

class Recommendation(BaseModel):
    movie: Movie
    score: int
    shared_genres: list[str] = []
    shared_actors: list[str] = []


# --- Search ---

class SearchResult(BaseModel):
    type: str  # "Movie", "Actor", "Director"
    id: int
    name: str
    extra: str = ""


class SearchResponse(BaseModel):
    results: list[SearchResult]
    total: int
