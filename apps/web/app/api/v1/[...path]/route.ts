import { NextResponse } from "next/server";

type RouteCtx = { params: Promise<{ path?: string[] }> };

export const dynamic = "force-dynamic";

function getFastApiBase() {
  return (
    process.env.FASTAPI_BASE_URL ??
    process.env.NEXT_PUBLIC_FASTAPI_BASE_URL ??
    "http://localhost:8000"
  ).replace(/\/$/, "");
}

function readCookieValue(cookieHeader: string, key: string): string | null {
  for (const item of cookieHeader.split(";")) {
    const [name, ...rest] = item.trim().split("=");
    if (name === key) return decodeURIComponent(rest.join("="));
  }
  return null;
}

function resolveBearerToken(request: Request): string | null {
  const auth = request.headers.get("authorization");
  if (auth?.startsWith("Bearer ")) return auth.slice(7).trim();

  const cookieHeader = request.headers.get("cookie") ?? "";
  const candidateKeys = [
    "udeets_access_token",
    "access_token",
  ];
  for (const key of candidateKeys) {
    const token = readCookieValue(cookieHeader, key);
    if (token) return token;
  }
  return null;
}

async function filterRequestHeaders(request: Request) {
  const headers = new Headers(request.headers);
  headers.delete("host");
  headers.delete("connection");
  headers.delete("content-length");
  if (!headers.has("authorization")) {
    const token = resolveBearerToken(request);
    if (token) {
      headers.set("authorization", `Bearer ${token}`);
    }
  }
  return headers;
}

function filterResponseHeaders(upstream: Response) {
  const headers = new Headers(upstream.headers);
  headers.delete("content-encoding");
  headers.delete("content-length");
  headers.delete("transfer-encoding");
  return headers;
}

async function proxy(request: Request, context: RouteCtx) {
  const { path = [] } = await context.params;
  const pathname = path.map(encodeURIComponent).join("/");
  const { search } = new URL(request.url);
  const target = `${getFastApiBase()}/api/v1/${pathname}${search}`;

  try {
    const method = request.method.toUpperCase();
    const hasBody = !["GET", "HEAD"].includes(method);
    const headers = await filterRequestHeaders(request);
    const upstream = await fetch(target, {
      method,
      headers,
      body: hasBody ? await request.arrayBuffer() : undefined,
      cache: "no-store",
      redirect: "manual",
    });

    return new NextResponse(await upstream.arrayBuffer(), {
      status: upstream.status,
      headers: filterResponseHeaders(upstream),
    });
  } catch (error) {
    console.error("[api/v1 proxy]", error);
    return NextResponse.json({ error: "Could not reach API service" }, { status: 502 });
  }
}

export async function GET(request: Request, context: RouteCtx) {
  return proxy(request, context);
}

export async function POST(request: Request, context: RouteCtx) {
  return proxy(request, context);
}

export async function PUT(request: Request, context: RouteCtx) {
  return proxy(request, context);
}

export async function PATCH(request: Request, context: RouteCtx) {
  return proxy(request, context);
}

export async function DELETE(request: Request, context: RouteCtx) {
  return proxy(request, context);
}

export async function OPTIONS(request: Request, context: RouteCtx) {
  return proxy(request, context);
}
