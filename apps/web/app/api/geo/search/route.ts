import { NextResponse } from "next/server";

// Server-side proxy for Nominatim nearby search.
// Sets the required User-Agent and applies an IP-based rate limit.

const RATE_LIMIT_WINDOW_MS = 1000;
const lastCallByIp = new Map<string, number>();

const NOMINATIM_UA = "uDeets/1.0 (contact: udeetsdev1@gmail.com)";

function getClientIp(request: Request): string {
  const fwd = request.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return request.headers.get("x-real-ip") ?? "unknown";
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const lat = searchParams.get("lat");
  const lon = searchParams.get("lon");
  const limit = searchParams.get("limit") ?? "8";
  const viewbox = searchParams.get("viewbox") ?? "";

  if (!lat || !lon) {
    return NextResponse.json({ error: "lat and lon are required" }, { status: 400 });
  }

  const ip = getClientIp(request);
  const now = Date.now();
  const last = lastCallByIp.get(ip) ?? 0;
  if (now - last < RATE_LIMIT_WINDOW_MS) {
    return NextResponse.json({ error: "Too many requests. Please wait a moment." }, { status: 429 });
  }
  lastCallByIp.set(ip, now);

  const params = new URLSearchParams({
    format: "json",
    q: "*",
    lat,
    lon,
    limit,
    bounded: "1",
  });
  if (viewbox) params.set("viewbox", viewbox);

  const url = `https://nominatim.openstreetmap.org/search?${params.toString()}`;

  try {
    const upstream = await fetch(url, {
      headers: {
        "User-Agent": NOMINATIM_UA,
        "Accept-Language": "en",
      },
      cache: "no-store",
    });

    if (!upstream.ok) {
      return NextResponse.json({ error: "Upstream geocoding service error" }, { status: 502 });
    }

    const data = await upstream.json();
    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "private, max-age=60",
      },
    });
  } catch (err) {
    console.error("[api/geo/search]", err);
    return NextResponse.json({ error: "Could not reach geocoding service" }, { status: 502 });
  }
}
