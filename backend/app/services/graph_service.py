from app.services.neo4j_service import Neo4jService


class GraphService:
    """Service for graph-related Cypher queries."""

    @staticmethod
    async def get_full_graph(
        types: list[str] | None = None,
        min_rating: float | None = None,
        max_rating: float | None = None,
        year_from: int | None = None,
        year_to: int | None = None,
        genre: str | None = None,
    ) -> dict:
        """Return all nodes and edges, optionally filtered."""

        # Build dynamic WHERE clause for movies
        movie_filters = []
        params: dict = {}
        if min_rating is not None:
            movie_filters.append("m.rating >= $min_rating")
            params["min_rating"] = min_rating
        if max_rating is not None:
            movie_filters.append("m.rating <= $max_rating")
            params["max_rating"] = max_rating
        if year_from is not None:
            movie_filters.append("m.year >= $year_from")
            params["year_from"] = year_from
        if year_to is not None:
            movie_filters.append("m.year <= $year_to")
            params["year_to"] = year_to
        if genre:
            movie_filters.append("EXISTS { (m)-[:BELONGS_TO]->(:Genre {name: $genre}) }")
            params["genre"] = genre

        movie_where = f"WHERE {' AND '.join(movie_filters)}" if movie_filters else ""

        # Determine which node types to include
        include_types = set(types) if types else {"Movie", "Actor", "Director", "Genre"}

        nodes_parts = []
        edges_parts = []

        if "Movie" in include_types:
            nodes_parts.append(f"""
                MATCH (m:Movie) {movie_where}
                RETURN 'movie_' + toString(m.id) AS id, m.title AS label, 'Movie' AS type, properties(m) AS properties
            """)

        if "Actor" in include_types and "Movie" in include_types:
            nodes_parts.append(f"""
                MATCH (a:Actor)-[:ACTED_IN]->(m:Movie) {movie_where}
                WITH DISTINCT a
                RETURN 'actor_' + toString(a.id) AS id, a.name AS label, 'Actor' AS type, properties(a) AS properties
            """)
            edges_parts.append(f"""
                MATCH (a:Actor)-[:ACTED_IN]->(m:Movie) {movie_where}
                RETURN 'actor_' + toString(a.id) AS source, 'movie_' + toString(m.id) AS target, 'ACTED_IN' AS type
            """)
        elif "Actor" in include_types:
            nodes_parts.append("""
                MATCH (a:Actor)
                RETURN 'actor_' + toString(a.id) AS id, a.name AS label, 'Actor' AS type, properties(a) AS properties
            """)

        if "Director" in include_types and "Movie" in include_types:
            nodes_parts.append(f"""
                MATCH (d:Director)-[:DIRECTED]->(m:Movie) {movie_where}
                WITH DISTINCT d
                RETURN 'director_' + toString(d.id) AS id, d.name AS label, 'Director' AS type, properties(d) AS properties
            """)
            edges_parts.append(f"""
                MATCH (d:Director)-[:DIRECTED]->(m:Movie) {movie_where}
                RETURN 'director_' + toString(d.id) AS source, 'movie_' + toString(m.id) AS target, 'DIRECTED' AS type
            """)
        elif "Director" in include_types:
            nodes_parts.append("""
                MATCH (d:Director)
                RETURN 'director_' + toString(d.id) AS id, d.name AS label, 'Director' AS type, properties(d) AS properties
            """)

        if "Genre" in include_types and "Movie" in include_types:
            nodes_parts.append(f"""
                MATCH (m:Movie)-[:BELONGS_TO]->(g:Genre) {movie_where}
                WITH DISTINCT g
                RETURN 'genre_' + g.name AS id, g.name AS label, 'Genre' AS type, properties(g) AS properties
            """)
            edges_parts.append(f"""
                MATCH (m:Movie)-[:BELONGS_TO]->(g:Genre) {movie_where}
                RETURN 'movie_' + toString(m.id) AS source, 'genre_' + g.name AS target, 'BELONGS_TO' AS type
            """)
        elif "Genre" in include_types:
            nodes_parts.append("""
                MATCH (g:Genre)
                RETURN 'genre_' + g.name AS id, g.name AS label, 'Genre' AS type, properties(g) AS properties
            """)

        # Combine with UNION
        if not nodes_parts:
            return {"nodes": [], "links": []}

        nodes_query = " UNION ALL ".join(nodes_parts)
        nodes = await Neo4jService.execute_read(nodes_query, params)

        links = []
        if edges_parts:
            edges_query = " UNION ALL ".join(edges_parts)
            edges = await Neo4jService.execute_read(edges_query, params)
            links = [e for e in edges if e.get("target")]

        return {"nodes": nodes, "links": links}

    @staticmethod
    async def get_movie_subgraph(movie_id: int) -> dict:
        """Return subgraph centered on a specific movie."""
        nodes_query = """
        MATCH (m:Movie {id: $movie_id})
        OPTIONAL MATCH (a:Actor)-[:ACTED_IN]->(m)
        OPTIONAL MATCH (d:Director)-[:DIRECTED]->(m)
        OPTIONAL MATCH (m)-[:BELONGS_TO]->(g:Genre)
        WITH collect(DISTINCT {id: 'movie_' + toString(m.id), label: m.title, type: 'Movie', properties: properties(m)}) +
             collect(DISTINCT {id: 'actor_' + toString(a.id), label: a.name, type: 'Actor', properties: properties(a)}) +
             collect(DISTINCT {id: 'director_' + toString(d.id), label: d.name, type: 'Director', properties: properties(d)}) +
             collect(DISTINCT {id: 'genre_' + g.name, label: g.name, type: 'Genre', properties: properties(g)}) AS nodes,
             collect(DISTINCT {source: 'actor_' + toString(a.id), target: 'movie_' + toString(m.id), type: 'ACTED_IN'}) +
             collect(DISTINCT {source: 'director_' + toString(d.id), target: 'movie_' + toString(m.id), type: 'DIRECTED'}) +
             collect(DISTINCT {source: 'movie_' + toString(m.id), target: 'genre_' + g.name, type: 'BELONGS_TO'}) AS links
        RETURN nodes, links
        """
        results = await Neo4jService.execute_read(nodes_query, {"movie_id": movie_id})
        if results:
            data = results[0]
            nodes = [n for n in data.get("nodes", []) if n.get("id") and not n["id"].endswith("_None") and n["id"] != "genre_None"]
            links = [l for l in data.get("links", []) if l.get("source") and l.get("target") and not l["source"].endswith("_None") and not l["target"].endswith("_None")]
            return {"nodes": nodes, "links": links}
        return {"nodes": [], "links": []}

    @staticmethod
    async def get_movie_details(movie_id: int) -> dict | None:
        """Get movie details with all relationships expanded."""
        query = """
        MATCH (m:Movie {id: $movie_id})
        OPTIONAL MATCH (a:Actor)-[:ACTED_IN]->(m)
        OPTIONAL MATCH (d:Director)-[:DIRECTED]->(m)
        OPTIONAL MATCH (m)-[:BELONGS_TO]->(g:Genre)
        RETURN m AS movie,
               collect(DISTINCT {id: a.id, name: a.name, poster_url: a.poster_url}) AS actors,
               collect(DISTINCT {id: d.id, name: d.name, poster_url: d.poster_url}) AS directors,
               collect(DISTINCT {name: g.name}) AS genres
        """
        results = await Neo4jService.execute_read(query, {"movie_id": movie_id})
        if not results:
            return None
        data = results[0]
        movie_props = data["movie"]
        return {
            "movie": movie_props,
            "actors": [a for a in data["actors"] if a.get("name")],
            "directors": [d for d in data["directors"] if d.get("name")],
            "genres": [g for g in data["genres"] if g.get("name")],
        }

    @staticmethod
    async def find_shortest_path(from_id: str, to_id: str) -> dict:
        """Find shortest path between any two nodes using Neo4j shortestPath."""
        # Determine node labels and properties for lookup
        def parse_node_id(node_id: str):
            if node_id.startswith("movie_"):
                return "Movie", "id", int(node_id.replace("movie_", ""))
            elif node_id.startswith("actor_"):
                return "Actor", "id", int(node_id.replace("actor_", ""))
            elif node_id.startswith("director_"):
                return "Director", "id", int(node_id.replace("director_", ""))
            elif node_id.startswith("genre_"):
                return "Genre", "name", node_id.replace("genre_", "")
            return None, None, None

        from_label, from_prop, from_val = parse_node_id(from_id)
        to_label, to_prop, to_val = parse_node_id(to_id)

        if not from_label or not to_label:
            return {"nodes": [], "links": [], "path_length": 0}

        query = f"""
        MATCH (start:{from_label} {{{from_prop}: $from_val}}),
              (end:{to_label} {{{to_prop}: $to_val}}),
              path = shortestPath((start)-[*..10]-(end))
        WITH nodes(path) AS pathNodes, relationships(path) AS pathRels
        UNWIND pathNodes AS n
        WITH collect(DISTINCT {{
            id: CASE WHEN n:Movie THEN 'movie_' + toString(n.id)
                     WHEN n:Actor THEN 'actor_' + toString(n.id)
                     WHEN n:Director THEN 'director_' + toString(n.id)
                     WHEN n:Genre THEN 'genre_' + n.name
                     ELSE toString(id(n)) END,
            label: CASE WHEN n:Movie THEN n.title
                        WHEN n:Actor THEN n.name
                        WHEN n:Director THEN n.name
                        WHEN n:Genre THEN n.name
                        ELSE 'Unknown' END,
            type: labels(n)[0],
            properties: properties(n)
        }}) AS nodes, pathRels
        UNWIND pathRels AS r
        WITH nodes, collect(DISTINCT {{
            source: CASE WHEN startNode(r):Movie THEN 'movie_' + toString(startNode(r).id)
                         WHEN startNode(r):Actor THEN 'actor_' + toString(startNode(r).id)
                         WHEN startNode(r):Director THEN 'director_' + toString(startNode(r).id)
                         WHEN startNode(r):Genre THEN 'genre_' + startNode(r).name
                         ELSE toString(id(startNode(r))) END,
            target: CASE WHEN endNode(r):Movie THEN 'movie_' + toString(endNode(r).id)
                         WHEN endNode(r):Actor THEN 'actor_' + toString(endNode(r).id)
                         WHEN endNode(r):Director THEN 'director_' + toString(endNode(r).id)
                         WHEN endNode(r):Genre THEN 'genre_' + endNode(r).name
                         ELSE toString(id(endNode(r))) END,
            type: type(r)
        }}) AS links
        RETURN nodes, links, size(links) AS path_length
        """
        results = await Neo4jService.execute_read(query, {"from_val": from_val, "to_val": to_val})
        if results:
            r = results[0]
            return {
                "nodes": r.get("nodes", []),
                "links": r.get("links", []),
                "path_length": r.get("path_length", 0),
            }
        return {"nodes": [], "links": [], "path_length": 0}

    @staticmethod
    async def get_person_details(person_type: str, person_id: int) -> dict | None:
        """Get detailed info for an actor or director."""
        label = "Actor" if person_type == "actor" else "Director"
        rel = "ACTED_IN" if person_type == "actor" else "DIRECTED"

        query = f"""
        MATCH (p:{label} {{id: $person_id}})
        OPTIONAL MATCH (p)-[:{rel}]->(m:Movie)
        OPTIONAL MATCH (m)-[:BELONGS_TO]->(g:Genre)
        WITH p, m, collect(DISTINCT g.name) AS movieGenres
        ORDER BY m.year DESC
        WITH p,
             collect(DISTINCT {{
                 id: m.id, title: m.title, year: m.year, rating: m.rating,
                 poster_url: m.poster_url, genres: movieGenres
             }}) AS filmography
        RETURN p AS person, filmography
        """
        results = await Neo4jService.execute_read(query, {"person_id": person_id})
        if not results:
            return None

        data = results[0]
        person = data["person"]
        films = [f for f in data["filmography"] if f.get("id")]

        # Calculate stats
        ratings = [f["rating"] for f in films if f.get("rating")]
        avg_rating = round(sum(ratings) / len(ratings), 1) if ratings else 0

        # Genre breakdown
        genre_counts: dict = {}
        for f in films:
            for g in f.get("genres", []):
                if g:
                    genre_counts[g] = genre_counts.get(g, 0) + 1
        top_genres = sorted(genre_counts.items(), key=lambda x: -x[1])[:5]

        # Co-stars / co-directors
        costar_rel = "ACTED_IN" if person_type == "actor" else "DIRECTED"
        costar_label = "Actor" if person_type == "actor" else "Director"
        costar_query = f"""
        MATCH (p:{label} {{id: $person_id}})-[:{rel}]->(m:Movie)<-[:{costar_rel}]-(co:{costar_label})
        WHERE co.id <> p.id
        RETURN co.id AS id, co.name AS name, co.poster_url AS poster_url,
               count(m) AS shared_movies, collect(m.title) AS movie_titles
        ORDER BY shared_movies DESC
        LIMIT 10
        """
        costars = await Neo4jService.execute_read(costar_query, {"person_id": person_id})

        return {
            "person": {
                "id": person.get("id"),
                "name": person.get("name"),
                "type": person_type,
                "poster_url": person.get("poster_url"),
            },
            "filmography": films,
            "stats": {
                "total_movies": len(films),
                "avg_rating": avg_rating,
                "year_range": f"{min(f['year'] for f in films if f.get('year'))}-{max(f['year'] for f in films if f.get('year'))}" if films and any(f.get('year') for f in films) else "N/A",
                "top_genres": [{"genre": g, "count": c} for g, c in top_genres],
            },
            "collaborators": costars or [],
        }

    @staticmethod
    async def get_all_nodes_list() -> list:
        """Get a flat list of all nodes for search/dropdown use."""
        query = """
        MATCH (n)
        RETURN
            CASE WHEN n:Movie THEN 'movie_' + toString(n.id)
                 WHEN n:Actor THEN 'actor_' + toString(n.id)
                 WHEN n:Director THEN 'director_' + toString(n.id)
                 WHEN n:Genre THEN 'genre_' + n.name
                 ELSE toString(id(n)) END AS id,
            CASE WHEN n:Movie THEN n.title
                 WHEN n:Actor THEN n.name
                 WHEN n:Director THEN n.name
                 WHEN n:Genre THEN n.name
                 ELSE 'Unknown' END AS label,
            labels(n)[0] AS type
        ORDER BY type, label
        """
        return await Neo4jService.execute_read(query)
