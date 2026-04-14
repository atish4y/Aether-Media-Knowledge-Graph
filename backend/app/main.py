from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.services.neo4j_service import Neo4jService
from app.routers import movies, graph, analytics, recommendations, search, ingest


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Manage Neo4j connection lifecycle."""
    await Neo4jService.connect()
    yield
    await Neo4jService.close()


app = FastAPI(
    title="Movie Intelligence Platform",
    description="Knowledge graph-powered movie analytics and recommendations API",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS
settings = get_settings()
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(movies.router)
app.include_router(graph.router)
app.include_router(analytics.router)
app.include_router(recommendations.router)
app.include_router(search.router)
app.include_router(ingest.router)


@app.get("/api/health")
async def health_check():
    """Health check endpoint."""
    try:
        result = await Neo4jService.execute_read("RETURN 1 AS status")
        neo4j_ok = bool(result)
    except Exception:
        neo4j_ok = False

    return {
        "status": "healthy" if neo4j_ok else "degraded",
        "neo4j": "connected" if neo4j_ok else "disconnected",
    }
