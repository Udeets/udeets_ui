import time
from collections import defaultdict
from threading import Lock

from fastapi import Request

from app.clients.nominatim import get_json

RATE_LIMIT_WINDOW_SECONDS = 1.0


class RateLimitError(Exception):
    pass


class GeoError(Exception):
    pass


class InMemoryGeoLimiter:
    def __init__(self) -> None:
        self._last_call_by_ip: dict[str, float] = defaultdict(float)
        self._lock = Lock()

    def allow(self, ip: str) -> None:
        now = time.monotonic()
        with self._lock:
            last = self._last_call_by_ip[ip]
            if now - last < RATE_LIMIT_WINDOW_SECONDS:
                raise RateLimitError("Too many requests. Please wait a moment.")
            self._last_call_by_ip[ip] = now

    def reset(self) -> None:
        with self._lock:
            self._last_call_by_ip.clear()


limiter = InMemoryGeoLimiter()


def _get_client_ip(request: Request) -> str:
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.headers.get("x-real-ip", "unknown")


async def reverse_geocode(request: Request, lat: float, lon: float) -> dict:
    limiter.allow(_get_client_ip(request))
    try:
        payload = await get_json(
            "/reverse",
            params={
                "format": "json",
                "lat": str(lat),
                "lon": str(lon),
                "zoom": "18",
                "addressdetails": "1",
            },
        )
    except RuntimeError as exc:
        raise GeoError(str(exc)) from exc
    except Exception as exc:
        raise GeoError("Could not reach geocoding service") from exc
    if not isinstance(payload, dict):
        raise GeoError("Unexpected reverse geocode response")
    return payload


async def search_nearby_places(
    request: Request, lat: float, lon: float, limit: int, viewbox: str | None
) -> list[dict]:
    limiter.allow(_get_client_ip(request))

    params = {
        "format": "json",
        "q": "*",
        "lat": str(lat),
        "lon": str(lon),
        "limit": str(limit),
        "bounded": "1",
    }
    if viewbox:
        params["viewbox"] = viewbox

    try:
        payload = await get_json("/search", params=params)
    except RuntimeError as exc:
        raise GeoError(str(exc)) from exc
    except Exception as exc:
        raise GeoError("Could not reach geocoding service") from exc

    if not isinstance(payload, list):
        raise GeoError("Unexpected nearby places response")
    return payload
