from app.services.neo4j_service import Neo4jService


class AnalyticsService:
    """Service for analytics aggregation queries."""

    @staticmethod
    async def get_overview() -> dict:
        """Get overview statistics for the dashboard cards."""
        query = """
        MATCH (m:Movie) WITH count(m) AS totalMovies
        MATCH (a:Actor) WITH totalMovies, count(a) AS totalActors
        MATCH (d:Director) WITH totalMovies, totalActors, count(d) AS totalDirectors
        MATCH (g:Genre) WITH totalMovies, totalActors, totalDirectors, count(g) AS totalGenres
        
        // Top genre
        OPTIONAL MATCH (m2:Movie)-[:BELONGS_TO]->(g2:Genre)
        WITH totalMovies, totalActors, totalDirectors, totalGenres, 
             g2.name AS genreName, count(m2) AS genreCount
        ORDER BY genreCount DESC
        LIMIT 1
        WITH totalMovies, totalActors, totalDirectors, totalGenres, 
             genreName AS topGenre
        
        // Most connected actor
        OPTIONAL MATCH (a2:Actor)-[:ACTED_IN]->(m3:Movie)
        WITH totalMovies, totalActors, totalDirectors, totalGenres, topGenre,
             a2.name AS actorName, count(m3) AS actorMovieCount
        ORDER BY actorMovieCount DESC
        LIMIT 1
        
        RETURN totalMovies, totalActors, totalDirectors, totalGenres, 
               topGenre, actorName AS mostConnectedActor, 
               actorMovieCount AS mostConnectedActorCount
        """
        results = await Neo4jService.execute_read(query)
        if results:
            r = results[0]
            return {
                "total_movies": r["totalMovies"],
                "total_actors": r["totalActors"],
                "total_directors": r["totalDirectors"],
                "total_genres": r["totalGenres"],
                "top_genre": r.get("topGenre", "N/A"),
                "most_connected_actor": r.get("mostConnectedActor", "N/A"),
                "most_connected_actor_count": r.get("mostConnectedActorCount", 0),
            }
        return {}

    @staticmethod
    async def get_top_actors(limit: int = 10) -> list:
        """Get actors ranked by number of movies."""
        query = """
        MATCH (a:Actor)-[:ACTED_IN]->(m:Movie)
        RETURN a.id AS id, a.name AS name, a.poster_url AS poster_url, count(m) AS movie_count
        ORDER BY movie_count DESC
        LIMIT $limit
        """
        return await Neo4jService.execute_read(query, {"limit": limit})

    @staticmethod
    async def get_genre_distribution() -> list:
        """Get genre distribution (genre name + count)."""
        query = """
        MATCH (m:Movie)-[:BELONGS_TO]->(g:Genre)
        RETURN g.name AS genre, count(m) AS count
        ORDER BY count DESC
        """
        return await Neo4jService.execute_read(query)

    @staticmethod
    async def get_movies_over_time() -> list:
        """Get movie count grouped by year."""
        query = """
        MATCH (m:Movie)
        RETURN m.year AS year, count(m) AS count
        ORDER BY year
        """
        return await Neo4jService.execute_read(query)

    @staticmethod
    async def get_actor_collaborations(limit: int = 20) -> list:
        """Get actor pairs who have appeared in the most movies together."""
        query = """
        MATCH (a1:Actor)-[:ACTED_IN]->(m:Movie)<-[:ACTED_IN]-(a2:Actor)
        WHERE id(a1) < id(a2)
        RETURN a1.name AS actor1, a2.name AS actor2, 
               count(m) AS shared_movies,
               collect(m.title) AS movie_titles
        ORDER BY shared_movies DESC
        LIMIT $limit
        """
        return await Neo4jService.execute_read(query, {"limit": limit})

    @staticmethod
    async def get_recommendations(movie_id: int, limit: int = 10) -> list:
        """Get movie recommendations based on shared genres and actors."""
        query = """
        MATCH (m:Movie {id: $movie_id})
        
        // Find movies sharing genres
        OPTIONAL MATCH (m)-[:BELONGS_TO]->(g:Genre)<-[:BELONGS_TO]-(rec:Movie)
        WHERE rec.id <> m.id
        WITH m, rec, collect(DISTINCT g.name) AS sharedGenres
        
        // Find movies sharing actors
        OPTIONAL MATCH (m)<-[:ACTED_IN]-(a:Actor)-[:ACTED_IN]->(rec)
        WITH rec, sharedGenres, collect(DISTINCT a.name) AS sharedActors
        
        // Score = shared genres + shared actors (weighted)
        WITH rec, sharedGenres, sharedActors,
             size(sharedGenres) * 2 + size(sharedActors) * 3 AS score
        WHERE score > 0
        
        RETURN rec AS movie, score, sharedGenres AS shared_genres, sharedActors AS shared_actors
        ORDER BY score DESC
        LIMIT $limit
        """
        return await Neo4jService.execute_read(query, {"movie_id": movie_id, "limit": limit})

    @staticmethod
    async def get_smart_recommendations(movie_ids: list[int], limit: int = 10) -> list:
        """Multi-movie recommendation: find movies similar to ALL given movies."""
        query = """
        UNWIND $movie_ids AS mid
        MATCH (m:Movie {id: mid})
        
        // Shared genres
        OPTIONAL MATCH (m)-[:BELONGS_TO]->(g:Genre)<-[:BELONGS_TO]-(rec:Movie)
        WHERE NOT rec.id IN $movie_ids
        WITH rec, collect(DISTINCT g.name) AS sharedGenres, collect(DISTINCT m.title) AS fromMovies
        
        // Shared actors
        OPTIONAL MATCH (rec)<-[:ACTED_IN]-(a:Actor)-[:ACTED_IN]->(m2:Movie)
        WHERE m2.id IN $movie_ids
        WITH rec, sharedGenres, fromMovies, collect(DISTINCT a.name) AS sharedActors
        
        // Shared directors
        OPTIONAL MATCH (rec)<-[:DIRECTED]-(d:Director)-[:DIRECTED]->(m3:Movie)
        WHERE m3.id IN $movie_ids
        WITH rec, sharedGenres, sharedActors, fromMovies, collect(DISTINCT d.name) AS sharedDirectors
        
        WITH rec, sharedGenres, sharedActors, sharedDirectors, fromMovies,
             size(sharedGenres) * 2 + size(sharedActors) * 3 + size(sharedDirectors) * 4 AS score
        WHERE score > 0
        
        RETURN rec AS movie, score, sharedGenres AS shared_genres, 
               sharedActors AS shared_actors, sharedDirectors AS shared_directors,
               fromMovies AS because_you_liked
        ORDER BY score DESC
        LIMIT $limit
        """
        return await Neo4jService.execute_read(query, {"movie_ids": movie_ids, "limit": limit})

    @staticmethod
    async def get_graph_stats() -> dict:
        """Get network-level graph statistics."""
        query = """
        MATCH (n)
        WITH count(n) AS totalNodes
        MATCH ()-[r]->()
        WITH totalNodes, count(r) AS totalEdges
        
        // Average degree
        MATCH (n)
        OPTIONAL MATCH (n)-[r]-()
        WITH totalNodes, totalEdges, n, count(r) AS degree
        WITH totalNodes, totalEdges, avg(degree) AS avgDegree, max(degree) AS maxDegree
        
        // Density = 2*E / (N * (N-1))
        WITH totalNodes, totalEdges, avgDegree, maxDegree,
             CASE WHEN totalNodes > 1 
                  THEN round(toFloat(2 * totalEdges) / (totalNodes * (totalNodes - 1)) * 10000) / 10000
                  ELSE 0 END AS density
        
        RETURN totalNodes, totalEdges, round(avgDegree * 100) / 100 AS avgDegree, 
               maxDegree, density
        """
        results = await Neo4jService.execute_read(query)
        if results:
            r = results[0]
            return {
                "total_nodes": r["totalNodes"],
                "total_edges": r["totalEdges"],
                "avg_degree": r["avgDegree"],
                "max_degree": r["maxDegree"],
                "density": r["density"],
            }
        return {}

    @staticmethod
    async def get_director_rankings(limit: int = 15) -> list:
        """Rank directors by average movie rating."""
        query = """
        MATCH (d:Director)-[:DIRECTED]->(m:Movie)
        WITH d, count(m) AS movie_count, 
             round(avg(m.rating) * 10) / 10 AS avg_rating,
             collect(m.title) AS movies
        WHERE movie_count >= 1
        RETURN d.id AS id, d.name AS name, d.poster_url AS poster_url,
               movie_count, avg_rating, movies
        ORDER BY avg_rating DESC
        LIMIT $limit
        """
        return await Neo4jService.execute_read(query, {"limit": limit})
