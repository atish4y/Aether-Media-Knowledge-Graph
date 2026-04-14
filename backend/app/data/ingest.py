"""
Data ingestion script - loads sample_movies.json into Neo4j.
Run: python -m app.data.ingest
"""
import asyncio
import json
import os
from pathlib import Path

from neo4j import AsyncGraphDatabase
from dotenv import load_dotenv

load_dotenv()

NEO4J_URI = os.getenv("NEO4J_URI", "bolt://localhost:7687")
NEO4J_USER = os.getenv("NEO4J_USER", "neo4j")
NEO4J_PASSWORD = os.getenv("NEO4J_PASSWORD", "movieintel123")

DATA_FILE = Path(__file__).parent / "sample_movies.json"


async def create_constraints(driver):
    """Create uniqueness constraints for all node types."""
    constraints = [
        "CREATE CONSTRAINT IF NOT EXISTS FOR (m:Movie) REQUIRE m.id IS UNIQUE",
        "CREATE CONSTRAINT IF NOT EXISTS FOR (a:Actor) REQUIRE a.id IS UNIQUE",
        "CREATE CONSTRAINT IF NOT EXISTS FOR (d:Director) REQUIRE d.id IS UNIQUE",
        "CREATE CONSTRAINT IF NOT EXISTS FOR (g:Genre) REQUIRE g.name IS UNIQUE",
    ]
    async with driver.session() as session:
        for c in constraints:
            await session.run(c)
    print("✓ Constraints created")


async def clear_database(driver):
    """Clear all nodes and relationships."""
    async with driver.session() as session:
        await session.run("MATCH (n) DETACH DELETE n")
    print("✓ Database cleared")


async def ingest_movies(driver, movies: list):
    """Batch-ingest all movies with their relationships."""
    async with driver.session() as session:
        # Create all genres first
        genres = set()
        for movie in movies:
            for g in movie.get("genres", []):
                genres.add(g)

        for genre_name in genres:
            await session.run(
                "MERGE (g:Genre {name: $name})",
                {"name": genre_name}
            )
        print(f"  ✓ {len(genres)} genres created")

        # Create directors
        directors_seen = set()
        for movie in movies:
            d = movie.get("director")
            if d and d["id"] not in directors_seen:
                await session.run(
                    "MERGE (d:Director {id: $id}) SET d.name = $name",
                    {"id": d["id"], "name": d["name"]}
                )
                directors_seen.add(d["id"])
        print(f"  ✓ {len(directors_seen)} directors created")

        # Create actors
        actors_seen = set()
        for movie in movies:
            for actor in movie.get("actors", []):
                if actor["id"] not in actors_seen:
                    await session.run(
                        "MERGE (a:Actor {id: $id}) SET a.name = $name",
                        {"id": actor["id"], "name": actor["name"]}
                    )
                    actors_seen.add(actor["id"])
        print(f"  ✓ {len(actors_seen)} actors created")

        # Create movies and relationships
        for movie in movies:
            # Create movie node
            await session.run(
                """
                MERGE (m:Movie {id: $id})
                SET m.title = $title,
                    m.year = $year,
                    m.rating = $rating,
                    m.overview = $overview,
                    m.poster_url = $poster_url
                """,
                {
                    "id": movie["id"],
                    "title": movie["title"],
                    "year": movie["year"],
                    "rating": movie["rating"],
                    "overview": movie["overview"],
                    "poster_url": movie.get("poster_url"),
                }
            )

            # BELONGS_TO relationships (Movie -> Genre)
            for genre_name in movie.get("genres", []):
                await session.run(
                    """
                    MATCH (m:Movie {id: $movie_id})
                    MATCH (g:Genre {name: $genre_name})
                    MERGE (m)-[:BELONGS_TO]->(g)
                    """,
                    {"movie_id": movie["id"], "genre_name": genre_name}
                )

            # DIRECTED relationship (Director -> Movie)
            d = movie.get("director")
            if d:
                await session.run(
                    """
                    MATCH (m:Movie {id: $movie_id})
                    MATCH (d:Director {id: $dir_id})
                    MERGE (d)-[:DIRECTED]->(m)
                    """,
                    {"movie_id": movie["id"], "dir_id": d["id"]}
                )

            # ACTED_IN relationships (Actor -> Movie)
            for actor in movie.get("actors", []):
                await session.run(
                    """
                    MATCH (m:Movie {id: $movie_id})
                    MATCH (a:Actor {id: $actor_id})
                    MERGE (a)-[:ACTED_IN]->(m)
                    """,
                    {"movie_id": movie["id"], "actor_id": actor["id"]}
                )

        print(f"  ✓ {len(movies)} movies created with relationships")


async def create_fulltext_index(driver):
    """Create full-text search indexes."""
    async with driver.session() as session:
        try:
            await session.run(
                """
                CREATE FULLTEXT INDEX movieSearch IF NOT EXISTS
                FOR (m:Movie) ON EACH [m.title, m.overview]
                """
            )
            await session.run(
                """
                CREATE FULLTEXT INDEX actorSearch IF NOT EXISTS
                FOR (a:Actor) ON EACH [a.name]
                """
            )
            await session.run(
                """
                CREATE FULLTEXT INDEX directorSearch IF NOT EXISTS
                FOR (d:Director) ON EACH [d.name]
                """
            )
            print("✓ Full-text indexes created")
        except Exception as e:
            print(f"⚠ Full-text index creation: {e}")


async def main():
    print("=" * 50)
    print("Movie Intelligence Platform — Data Ingestion")
    print("=" * 50)

    # Load data
    with open(DATA_FILE, "r", encoding="utf-8") as f:
        data = json.load(f)
    movies = data["movies"]
    print(f"\n📂 Loaded {len(movies)} movies from {DATA_FILE.name}")

    # Connect to Neo4j
    driver = AsyncGraphDatabase.driver(NEO4J_URI, auth=(NEO4J_USER, NEO4J_PASSWORD))
    try:
        await driver.verify_connectivity()
        print(f"✓ Connected to Neo4j at {NEO4J_URI}\n")

        await create_constraints(driver)
        await clear_database(driver)

        print("\n📊 Ingesting data...")
        await ingest_movies(driver, movies)

        await create_fulltext_index(driver)

        # Print stats
        async with driver.session() as session:
            result = await session.run("MATCH (n) RETURN labels(n)[0] AS label, count(n) AS count")
            print("\n📈 Final counts:")
            async for record in result:
                print(f"  {record['label']}: {record['count']}")

            result = await session.run("MATCH ()-[r]->() RETURN type(r) AS type, count(r) AS count")
            print("\n🔗 Relationships:")
            async for record in result:
                print(f"  {record['type']}: {record['count']}")

        print("\n✅ Ingestion complete!")

    finally:
        await driver.close()


if __name__ == "__main__":
    asyncio.run(main())
