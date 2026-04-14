from fastapi import APIRouter, HTTPException, BackgroundTasks
from app.services.tmdb_service import search_and_fetch_movie
from app.services.neo4j_service import Neo4jService
from app.services.embedding_service import generate_embedding

router = APIRouter(prefix="/api/movies", tags=["movies", "ingestion"])

@router.post("/ingest")
async def ingest_movie(title: str):
    """
    Search TMDB for a movie by title. If found, fetch posters, cast, crew,
    generate vector embeddings for semantic search, and dynamically insert
    the entire structured subgraph into Neo4j.
    """
    data = await search_and_fetch_movie(title)
    if not data:
        raise HTTPException(status_code=404, detail="Movie not found on TMDB")

    movie = data["movie"]
    genres = data["genres"]
    actors = data["actors"]
    directors = data["directors"]

    # Generate semantic embedding combining title, genres and overview
    genre_str = ", ".join([g["name"] for g in genres])
    semantic_text = f"Title: {movie['title']}. Genres: {genre_str}. Plot: {movie['overview']}"
    embedding = generate_embedding(semantic_text)
    
    # Large merge query to gracefully add or update the whole subgraph
    query = """
    // 1. Merge Movie
    MERGE (m:Movie {id: $movie.id})
    SET m.title = $movie.title, 
        m.year = $movie.year, 
        m.rating = $movie.rating, 
        m.overview = $movie.overview, 
        m.poster_url = $movie.poster_url,
        m.embedding = $embedding

    // 2. Merge Genres
    WITH m
    UNWIND $genres as genre_data
    MERGE (g:Genre {name: genre_data.name})
    ON CREATE SET g.id = genre_data.id
    MERGE (m)-[:BELONGS_TO]->(g)

    // 3. Merge Actors
    WITH DISTINCT m
    UNWIND $actors as actor_data
    MERGE (a:Actor {id: actor_data.id})
    SET a.name = actor_data.name, a.poster_url = actor_data.poster_url
    MERGE (a)-[:ACTED_IN]->(m)

    // 4. Merge Directors
    WITH DISTINCT m
    UNWIND $directors as director_data
    MERGE (d:Director {id: director_data.id})
    SET d.name = director_data.name, d.poster_url = director_data.poster_url
    MERGE (d)-[:DIRECTED]->(m)

    RETURN m
    """
    
    await Neo4jService.execute_write(query, {
        "movie": movie,
        "genres": genres,
        "actors": actors,
        "directors": directors,
        "embedding": embedding
    })
    
    return {"message": "Success", "title": movie["title"], "id": movie["id"]}
