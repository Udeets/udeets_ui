import { apiFetch } from "@/lib/api/client";

type GeoReverse = {
  name?: string;
  display_name?: string;
  address?: { road?: string };
};

type GeoSearchPlace = {
  name?: string;
  display_name: string;
};

export async function reverseGeo(lat: number, lon: number): Promise<GeoReverse> {
  return apiFetch<GeoReverse>("/geo/reverse", {
    query: { lat, lon },
  });
}

export async function searchGeoNearby(
  lat: number,
  lon: number,
  limit: number,
  viewbox: string
): Promise<GeoSearchPlace[]> {
  return apiFetch<GeoSearchPlace[]>("/geo/search", {
    query: { lat, lon, limit, viewbox },
  });
}
