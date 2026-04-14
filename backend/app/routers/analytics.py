from fastapi import APIRouter, Query
from app.services.analytics_service import AnalyticsService

router = APIRouter(prefix="/api/analytics", tags=["analytics"])


@router.get("/overview")
async def get_overview():
    return await AnalyticsService.get_overview()


@router.get("/top-actors")
async def get_top_actors(limit: int = 10):
    return await AnalyticsService.get_top_actors(limit)


@router.get("/genre-distribution")
async def get_genre_distribution():
    return await AnalyticsService.get_genre_distribution()


@router.get("/movies-over-time")
async def get_movies_over_time():
    return await AnalyticsService.get_movies_over_time()


@router.get("/collaborations")
async def get_collaborations(limit: int = 20):
    return await AnalyticsService.get_actor_collaborations(limit)


@router.get("/graph-stats")
async def get_graph_stats():
    return await AnalyticsService.get_graph_stats()


@router.get("/director-rankings")
async def get_director_rankings(limit: int = 15):
    return await AnalyticsService.get_director_rankings(limit)
