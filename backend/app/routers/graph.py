from fastapi import APIRouter, Query
from typing import Optional
from app.services.graph_service import GraphService

router = APIRouter(prefix="/api/graph", tags=["graph"])


@router.get("")
async def get_graph(
    types: Optional[str] = Query(None, description="Comma-separated node types: Movie,Actor,Director,Genre"),
    min_rating: Optional[float] = Query(None),
    max_rating: Optional[float] = Query(None),
    year_from: Optional[int] = Query(None),
    year_to: Optional[int] = Query(None),
    genre: Optional[str] = Query(None),
):
    """Get full graph with optional filters."""
    type_list = types.split(",") if types else None
    return await GraphService.get_full_graph(
        types=type_list,
        min_rating=min_rating,
        max_rating=max_rating,
        year_from=year_from,
        year_to=year_to,
        genre=genre,
    )


@router.get("/movie/{movie_id}")
async def get_movie_subgraph(movie_id: int):
    """Get subgraph centered on a specific movie."""
    return await GraphService.get_movie_subgraph(movie_id)


@router.get("/path")
async def find_path(
    from_id: str = Query(..., alias="from"),
    to_id: str = Query(..., alias="to"),
):
    """Find shortest path between two nodes."""
    return await GraphService.find_shortest_path(from_id, to_id)


@router.get("/nodes")
async def get_all_nodes():
    """Get flat list of all nodes for dropdowns/search."""
    return await GraphService.get_all_nodes_list()


@router.get("/person/{person_type}/{person_id}")
async def get_person(person_type: str, person_id: int):
    """Get actor or director details with filmography."""
    return await GraphService.get_person_details(person_type, person_id)
