from fastapi import APIRouter, Query, Request
from fastapi.responses import JSONResponse

from app.services.geo import (
    GeoError,
    RateLimitError,
    reverse_geocode,
    search_nearby_places,
)

router = APIRouter(prefix="/geo", tags=["geo"])


@router.get("/reverse")
async def geo_reverse(
    request: Request,
    lat: float | None = Query(default=None),
    lon: float | None = Query(default=None),
) -> JSONResponse:
    if lat is None or lon is None:
        return JSONResponse({"error": "lat and lon are required"}, status_code=400)

    try:
        payload = await reverse_geocode(request=request, lat=lat, lon=lon)
    except RateLimitError as exc:
        return JSONResponse({"error": str(exc)}, status_code=429)
    except GeoError as exc:
        return JSONResponse({"error": str(exc)}, status_code=502)

    return JSONResponse(payload, headers={"Cache-Control": "private, max-age=60"})


@router.get("/search")
async def geo_search(
    request: Request,
    lat: float | None = Query(default=None),
    lon: float | None = Query(default=None),
    limit: int = Query(default=8, ge=1, le=20),
    viewbox: str | None = Query(default=None),
) -> JSONResponse:
    if lat is None or lon is None:
        return JSONResponse({"error": "lat and lon are required"}, status_code=400)

    try:
        payload = await search_nearby_places(
            request=request,
            lat=lat,
            lon=lon,
            limit=limit,
            viewbox=viewbox,
        )
    except RateLimitError as exc:
        return JSONResponse({"error": str(exc)}, status_code=429)
    except GeoError as exc:
        return JSONResponse({"error": str(exc)}, status_code=502)

    return JSONResponse(payload, headers={"Cache-Control": "private, max-age=60"})
