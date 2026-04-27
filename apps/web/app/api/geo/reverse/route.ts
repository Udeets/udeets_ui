import { NextResponse } from "next/server";

// Minimal server-side proxy to Nominatim reverse geocoding.
// Sets the required User-Agent (per Nominatim Usage Policy) and
// rate-limits per IP using an in-memory token bucket.

const RATE_LIMIT_WINDOW_MS = 1000; // 1 request/sec/IP
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

  const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}&zoom=18&addressdetails=1`;

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
        // Let the client cache a single lookup briefly.
        "Cache-Control": "private, max-age=60",
      },
    });
  } catch (err) {
    console.error("[api/geo/reverse]", err);
    return NextResponse.json({ error: "Could not reach geocoding service" }, { status: 502 });
  }
}
