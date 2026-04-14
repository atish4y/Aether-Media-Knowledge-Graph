"""
Bulk Poster Backfill Script
===========================
Fetches poster URLs from TMDB for all existing movies, actors, and directors
in the Neo4j database that don't already have poster_url set.

Usage:
    cd backend
    .\\venv\\Scripts\\Activate.ps1
    python backfill_posters.py
"""

import asyncio
import os
import httpx
from neo4j import AsyncGraphDatabase
from dotenv import load_dotenv
import time

load_dotenv()

# ── Config ──
TMDB_API_KEY = os.getenv("TMDB_API_KEY", "").strip('"')
TMDB_BASE = "https://api.themoviedb.org/3"
IMG_BASE = "https://image.tmdb.org/t/p/w500"

NEO4J_URI = os.getenv("NEO4J_URI")
NEO4J_USER = os.getenv("NEO4J_USER")
NEO4J_PASSWORD = os.getenv("NEO4J_PASSWORD")


async def main():
    print("=" * 60)
    print("  TMDB Poster Backfill Script")
    print("=" * 60)
    print(f"  TMDB Key: ...{TMDB_API_KEY[-6:]}")
    print(f"  Neo4j:    {NEO4J_URI}")
    print()

    driver = AsyncGraphDatabase.driver(NEO4J_URI, auth=(NEO4J_USER, NEO4J_PASSWORD))

    async with driver.session() as session:
        # ── 1. Get all movies without poster_url ──
        result = await session.run(
            "MATCH (m:Movie) WHERE m.poster_url IS NULL RETURN m.id AS id, m.title AS title"
        )
        movies = [record.data() async for record in result]
        print(f"  Found {len(movies)} movies without posters\n")

        # ── 2. Get all actors without poster_url ──
        result = await session.run(
            "MATCH (a:Actor) WHERE a.poster_url IS NULL RETURN a.id AS id, a.name AS name"
        )
        actors = [record.data() async for record in result]
        print(f"  Found {len(actors)} actors without posters\n")

        # ── 3. Get all directors without poster_url ──
        result = await session.run(
            "MATCH (d:Director) WHERE d.poster_url IS NULL RETURN d.id AS id, d.name AS name"
        )
        directors = [record.data() async for record in result]
        print(f"  Found {len(directors)} directors without posters\n")

    # ── Fetch from TMDB and update ──
    async with httpx.AsyncClient(timeout=15) as http:
        updated = 0
        failed = 0

        # --- Movies ---
        print("--- Fetching Movie Posters ---")
        for i, movie in enumerate(movies):
            title = movie["title"]
            try:
                resp = await http.get(
                    f"{TMDB_BASE}/search/movie",
                    params={"api_key": TMDB_API_KEY, "query": title, "page": 1}
                )
                data = resp.json()
                results = data.get("results", [])

                poster_url = None
                if results:
                    poster_path = results[0].get("poster_path")
                    if poster_path:
                        poster_url = f"{IMG_BASE}{poster_path}"

                if poster_url:
                    async with driver.session() as session:
                        await session.run(
                            "MATCH (m:Movie {id: $id}) SET m.poster_url = $poster_url",
                            {"id": movie["id"], "poster_url": poster_url}
                        )
                    print(f"  [OK] [{i+1}/{len(movies)}] {title}")
                    updated += 1
                else:
                    print(f"  [--] [{i+1}/{len(movies)}] {title} - no poster found")
                    failed += 1

                # Rate limit: TMDB allows ~40 req/10s
                await asyncio.sleep(0.3)

            except Exception as e:
                print(f"  [!!] [{i+1}/{len(movies)}] {title} - ERROR: {e}")
                failed += 1

        # --- Actors ---
        print("\n--- Fetching Actor Photos ---")
        for i, actor in enumerate(actors):
            name = actor["name"]
            try:
                resp = await http.get(
                    f"{TMDB_BASE}/search/person",
                    params={"api_key": TMDB_API_KEY, "query": name, "page": 1}
                )
                data = resp.json()
                results = data.get("results", [])

                poster_url = None
                if results:
                    profile_path = results[0].get("profile_path")
                    if profile_path:
                        poster_url = f"{IMG_BASE}{profile_path}"

                if poster_url:
                    async with driver.session() as session:
                        await session.run(
                            "MATCH (a:Actor {id: $id}) SET a.poster_url = $poster_url",
                            {"id": actor["id"], "poster_url": poster_url}
                        )
                    print(f"  [OK] [{i+1}/{len(actors)}] {name}")
                    updated += 1
                else:
                    print(f"  [--] [{i+1}/{len(actors)}] {name} - no photo found")
                    failed += 1

                await asyncio.sleep(0.3)

            except Exception as e:
                print(f"  [!!] [{i+1}/{len(actors)}] {name} - ERROR: {e}")
                failed += 1

        # --- Directors ---
        print("\n--- Fetching Director Photos ---")
        for i, director in enumerate(directors):
            name = director["name"]
            try:
                resp = await http.get(
                    f"{TMDB_BASE}/search/person",
                    params={"api_key": TMDB_API_KEY, "query": name, "page": 1}
                )
                data = resp.json()
                results = data.get("results", [])

                poster_url = None
                if results:
                    profile_path = results[0].get("profile_path")
                    if profile_path:
                        poster_url = f"{IMG_BASE}{profile_path}"

                if poster_url:
                    async with driver.session() as session:
                        await session.run(
                            "MATCH (d:Director {id: $id}) SET d.poster_url = $poster_url",
                            {"id": director["id"], "poster_url": poster_url}
                        )
                    print(f"  [OK] [{i+1}/{len(directors)}] {name}")
                    updated += 1
                else:
                    print(f"  [--] [{i+1}/{len(directors)}] {name} - no photo found")
                    failed += 1

                await asyncio.sleep(0.3)

            except Exception as e:
                print(f"  [!!] [{i+1}/{len(directors)}] {name} - ERROR: {e}")
                failed += 1

    await driver.close()

    print()
    print("=" * 60)
    print(f"  DONE - {updated} updated, {failed} failed")
    print("=" * 60)


if __name__ == "__main__":
    asyncio.run(main())
