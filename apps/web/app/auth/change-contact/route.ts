import { NextResponse } from "next/server";
import { applyAuthCookie, getFastApiBase, AUTH_ACCESS_COOKIE } from "@/lib/auth/auth-cookie-server";

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as { channel?: string; value?: string };
    const cookieHeader = request.headers.get("cookie") ?? "";
    const tokenMatch = cookieHeader.match(new RegExp(`${AUTH_ACCESS_COOKIE}=([^;]+)`));
    const accessToken = tokenMatch ? decodeURIComponent(tokenMatch[1]) : null;
    if (!accessToken) {
      return NextResponse.json({ error: "Not signed in" }, { status: 401 });
    }

    const upstream = await fetch(`${getFastApiBase()}/api/v1/auth/change-contact`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ channel: payload.channel, value: payload.value }),
      cache: "no-store",
    });
    const body = (await upstream.json()) as {
      accessToken?: string;
      user?: unknown;
      error?: string;
      detail?: string;
    };
    if (!upstream.ok) {
      throw new Error(
        (typeof body.detail === "string" && body.detail) || body.error || "Could not update contact",
      );
    }

    const response = NextResponse.json({ user: body.user });
    applyAuthCookie(response, body.accessToken);
    return response;
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not update contact" },
      { status: 400 },
    );
  }
}
