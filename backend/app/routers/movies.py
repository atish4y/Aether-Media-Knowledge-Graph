from fastapi import APIRouter, Query
from app.services.neo4j_service import Neo4jService
from app.services.graph_service import GraphService

router = APIRouter(prefix="/api/movies", tags=["Movies"])


from typing import Optional

@router.get("")
async def list_movies(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    sort_by: str = Query("title", regex="^(title|year|rating)$"),
    order: str = Query("asc", regex="^(asc|desc)$"),
    genre: Optional[str] = Query(None),
    year: Optional[int] = Query(None)
):
    """List all movies with pagination, sorting, and optional filtering."""
    skip = (page - 1) * limit
    order_clause = "ASC" if order == "asc" else "DESC"

    where_clauses = []
    if year is not None:
        where_clauses.append("m.year = $year")
    if genre is not None:
        where_clauses.append("g_filter.name = $genre")

    where_string = ("WHERE " + " AND ".join(where_clauses)) if where_clauses else ""
    genre_match = "MATCH (m)-[:BELONGS_TO]->(g_filter:Genre)" if genre else ""

    query = f"""
    MATCH (m:Movie)
    {genre_match}
    {where_string}
    OPTIONAL MATCH (m)-[:BELONGS_TO]->(g:Genre)
    WITH m, collect(g.name) AS genres
    RETURN m AS movie, genres
    ORDER BY m.{sort_by} {order_clause}
    SKIP $skip LIMIT $limit
    """

    count_query = f"""
    MATCH (m:Movie)
    {genre_match}
    {where_string}
    RETURN count(m) AS total
    """

    params = {"skip": skip, "limit": limit}
    if year is not None: params["year"] = year
    if genre is not None: params["genre"] = genre

    results = await Neo4jService.execute_read(query, params)
    count_res = await Neo4jService.execute_read(count_query, params)
    total = count_res[0]["total"] if count_res else 0

    movies = []
    for r in results:
        movie = dict(r["movie"])
        movie["genres"] = r["genres"]
        movies.append(movie)

    return {
        "movies": movies,
        "total": total,
        "page": page,
        "limit": limit,
        "pages": (total + limit - 1) // limit,
    }


@router.get("/{movie_id}")
async def get_movie(movie_id: int):
    """Get movie details with all relationships."""
    details = await GraphService.get_movie_details(movie_id)
    if not details:
        return {"error": "Movie not found"}, 404
    return details
