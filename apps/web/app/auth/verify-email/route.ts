import { NextResponse, type NextRequest } from "next/server";
import { applyAuthCookie, callAuthApi } from "@/lib/auth/auth-cookie-server";

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");
  if (!token) {
    return NextResponse.redirect(new URL("/auth/verify?error=missing_token", request.url));
  }

  try {
    const body = await callAuthApi(`verify-email?token=${encodeURIComponent(token)}`, {
      method: "GET",
    });
    const redirectTo = body.user?.verificationComplete
      ? "/dashboard"
      : "/dashboard?verifyOpen=email";
    const response = NextResponse.redirect(new URL(redirectTo, request.url));
    if (body.accessToken) {
      applyAuthCookie(response, body.accessToken);
    }
    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Verification failed";
    return NextResponse.redirect(
      new URL(`/auth/verify?error=${encodeURIComponent(message)}`, request.url),
    );
  }
}
