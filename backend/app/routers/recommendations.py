from fastapi import APIRouter, Query
from pydantic import BaseModel
from app.services.analytics_service import AnalyticsService

router = APIRouter(prefix="/api/recommendations", tags=["recommendations"])


@router.get("/{movie_id}")
async def get_recommendations(movie_id: int, limit: int = 10):
    results = await AnalyticsService.get_recommendations(movie_id, limit)
    return {
        "movie_id": movie_id,
        "recommendations": results,
    }


class SmartRecommendRequest(BaseModel):
    movie_ids: list[int]
    limit: int = 10


@router.post("/smart")
async def get_smart_recommendations(req: SmartRecommendRequest):
    results = await AnalyticsService.get_smart_recommendations(req.movie_ids, req.limit)
    return {
        "input_movie_ids": req.movie_ids,
        "recommendations": results,
    }
