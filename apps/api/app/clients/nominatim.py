import httpx

NOMINATIM_UA = "uDeets/1.0 (contact: udeetsdev1@gmail.com)"
BASE_URL = "https://nominatim.openstreetmap.org"


async def get_json(path: str, params: dict[str, str]) -> dict | list:
    async with httpx.AsyncClient(timeout=8.0) as client:
        response = await client.get(
            f"{BASE_URL}{path}",
            params=params,
            headers={
                "User-Agent": NOMINATIM_UA,
                "Accept-Language": "en",
            },
        )
    if response.status_code >= 400:
        raise RuntimeError("Upstream geocoding service error")
    return response.json()
