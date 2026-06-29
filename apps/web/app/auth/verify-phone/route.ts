import { NextResponse } from "next/server";
import { applyAuthCookie, callAuthApi, getFastApiBase } from "@/lib/auth/auth-cookie-server";
import { AUTH_ACCESS_COOKIE } from "@/lib/auth/auth-cookie-server";

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as { code?: string };
    const cookieHeader = request.headers.get("cookie") ?? "";
    const tokenMatch = cookieHeader.match(new RegExp(`${AUTH_ACCESS_COOKIE}=([^;]+)`));
    const accessToken = tokenMatch ? decodeURIComponent(tokenMatch[1]) : null;
    if (!accessToken) {
      return NextResponse.json({ error: "Not signed in" }, { status: 401 });
    }

    const upstream = await fetch(`${getFastApiBase()}/api/v1/auth/verify-phone/confirm`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ code: payload.code }),
      cache: "no-store",
    });
    const body = (await upstream.json()) as {
      accessToken?: string;
      user?: { verificationComplete?: boolean };
      error?: string;
      detail?: string;
    };
    if (!upstream.ok) {
      throw new Error(
        (typeof body.detail === "string" && body.detail) ||
          body.error ||
          "Invalid code",
      );
    }

    const redirectTo = body.user?.verificationComplete ? "/dashboard" : "/auth/verify";
    const response = NextResponse.json({ user: body.user, redirectTo });
    applyAuthCookie(response, body.accessToken);
    return response;
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Verification failed" },
      { status: 400 },
    );
  }
}
