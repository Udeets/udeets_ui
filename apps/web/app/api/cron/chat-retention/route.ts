import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization") ?? "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  if (!secret || token !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const fastApiBase = (
    process.env.NEXT_PUBLIC_FASTAPI_BASE_URL ??
    process.env.FASTAPI_BASE_URL ??
    "http://localhost:8000"
  ).replace(/\/$/, "");

  try {
    const response = await fetch(`${fastApiBase}/internal/cron/chat-retention`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    });
    const data = await response.json().catch(() => ({ error: "Retention purge failed." }));
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("[cron/chat-retention proxy]", error);
    return NextResponse.json({ error: "Retention purge failed." }, { status: 500 });
  }
}
