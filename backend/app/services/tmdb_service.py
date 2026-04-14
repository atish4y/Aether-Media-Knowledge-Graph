import httpx
from fastapi import HTTPException
from app.config import get_settings

TMDB_BASE_URL = "https://api.themoviedb.org/3"
IMG_BASE_URL = "https://image.tmdb.org/t/p/w500"


def _get_tmdb_key() -> str:
    key = get_settings().tmdb_api_key
    if not key:
        raise HTTPException(status_code=500, detail="TMDB_API_KEY not configured in .env")
    # Strip any surrounding quotes
    return key.strip('"').strip("'")


async def search_and_fetch_movie(query: str):
    TMDB_API_KEY = _get_tmdb_key()

    async with httpx.AsyncClient() as client:
        # Search for movie
        search_resp = await client.get(
            f"{TMDB_BASE_URL}/search/movie",
            params={"api_key": TMDB_API_KEY, "query": query, "language": "en-US", "page": 1}
        )
        search_data = search_resp.json()
        
        if not search_data.get("results"):
            return None
            
        first_movie = search_data["results"][0]
        movie_id = first_movie["id"]

        # Fetch full details (includes genres, runtime)
        detail_resp = await client.get(
            f"{TMDB_BASE_URL}/movie/{movie_id}",
            params={"api_key": TMDB_API_KEY, "language": "en-US"}
        )
        movie_details = detail_resp.json()

        # Fetch credits (cast & crew)
        credits_resp = await client.get(
            f"{TMDB_BASE_URL}/movie/{movie_id}/credits",
            params={"api_key": TMDB_API_KEY, "language": "en-US"}
        )
        credits_data = credits_resp.json()

        return extract_neo4j_format(movie_details, credits_data)

def extract_neo4j_format(movie: dict, credits: dict):
    # Process Movie
    movie_node = {
        "id": movie["id"],
        "title": movie["title"],
        "year": int(movie["release_date"][:4]) if movie.get("release_date") else None,
        "rating": movie.get("vote_average", 0.0),
        "overview": movie.get("overview", ""),
        "poster_url": f"{IMG_BASE_URL}{movie['poster_path']}" if movie.get("poster_path") else None
    }

    # Process Genres
    genres = [{"id": g["id"], "name": g["name"]} for g in movie.get("genres", [])]

    # Process Actors (Top 8)
    actors = []
    for cast in credits.get("cast", [])[:8]:
        actors.append({
            "id": cast["id"],
            "name": cast["name"],
            "poster_url": f"{IMG_BASE_URL}{cast['profile_path']}" if cast.get("profile_path") else None
        })

    # Process Directors
    directors = []
    for crew in credits.get("crew", []):
        if crew["job"] == "Director":
            directors.append({
                "id": crew["id"],
                "name": crew["name"],
                "poster_url": f"{IMG_BASE_URL}{crew['profile_path']}" if crew.get("profile_path") else None
            })

    return {
        "movie": movie_node,
        "genres": genres,
        "actors": actors,
        "directors": directors
    }
