from fastapi import APIRouter, Query, HTTPException
from app.services.neo4j_service import Neo4jService
from app.services.embedding_service import generate_embedding

router = APIRouter(prefix="/api/search", tags=["Search"])

@router.get("/semantic")
async def semantic_search(q: str = Query(..., min_length=2)):
    """Search movies using vector embedding of the query."""
    try:
        embedding = generate_embedding(q)
    except Exception as e:
        raise HTTPException(status_code=500, detail="Could not generate embedding for query")

    query = """
    CALL db.index.vector.queryNodes('movie_embeddings', 10, $embedding)
    YIELD node AS m, score
    OPTIONAL MATCH (m)-[:BELONGS_TO]->(g:Genre)
    RETURN m AS node, 'Movie' AS type, collect(g.name) AS genres, score
    ORDER BY score DESC
    """
    
    movie_results = await Neo4jService.execute_read(query, {"embedding": embedding})
    results = []
    for r in movie_results:
        movie = dict(r["node"])
        # Remove massive embedding array from result payload
        movie.pop("embedding", None)
        results.append({
            "type": "Movie",
            "id": movie.get("id"),
            "name": movie.get("title", ""),
            "extra": f"Match Score: {round(r['score']*100)}%",
            "genres": r.get("genres", []),
            "data": movie,
        })
        
    return {"results": results, "total": len(results), "query": q}

@router.get("")
async def search(q: str = Query(..., min_length=1, description="Search query")):
    """Search across movies, actors, and directors using full-text index."""
    results = []

    # Search movies by title (case-insensitive contains)
    movie_query = """
    MATCH (m:Movie)
    WHERE toLower(m.title) CONTAINS toLower($query)
    OPTIONAL MATCH (m)-[:BELONGS_TO]->(g:Genre)
    RETURN m AS node, 'Movie' AS type, collect(g.name) AS genres
    LIMIT 10
    """
    movie_results = await Neo4jService.execute_read(movie_query, {"query": q})
    for r in movie_results:
        movie = dict(r["node"])
        results.append({
            "type": "Movie",
            "id": movie.get("id"),
            "name": movie.get("title", ""),
            "extra": f"{movie.get('year', '')} • ★ {movie.get('rating', '')}",
            "genres": r.get("genres", []),
            "data": movie,
        })

    # Search actors
    actor_query = """
    MATCH (a:Actor)
    WHERE toLower(a.name) CONTAINS toLower($query)
    OPTIONAL MATCH (a)-[:ACTED_IN]->(m:Movie)
    RETURN a AS node, 'Actor' AS type, count(m) AS movie_count, 
           collect(m.title)[0..3] AS sample_movies
    LIMIT 10
    """
    actor_results = await Neo4jService.execute_read(actor_query, {"query": q})
    for r in actor_results:
        actor = dict(r["node"])
        results.append({
            "type": "Actor",
            "id": actor.get("id"),
            "name": actor.get("name", ""),
            "extra": f"{r['movie_count']} movies",
            "sample_movies": r.get("sample_movies", []),
            "data": actor,
        })

    # Search directors
    director_query = """
    MATCH (d:Director)
    WHERE toLower(d.name) CONTAINS toLower($query)
    OPTIONAL MATCH (d)-[:DIRECTED]->(m:Movie)
    RETURN d AS node, 'Director' AS type, count(m) AS movie_count,
           collect(m.title)[0..3] AS sample_movies
    LIMIT 10
    """
    director_results = await Neo4jService.execute_read(director_query, {"query": q})
    for r in director_results:
        director = dict(r["node"])
        results.append({
            "type": "Director",
            "id": director.get("id"),
            "name": director.get("name", ""),
            "extra": f"{r['movie_count']} movies directed",
            "sample_movies": r.get("sample_movies", []),
            "data": director,
        })

    return {"results": results, "total": len(results), "query": q}
