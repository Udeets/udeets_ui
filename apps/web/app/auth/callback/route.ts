import { NextResponse, type NextRequest } from "next/server";
import { sanitizeAuthNextPath } from "@/lib/auth/auth-callback-utils";
import { applyAuthCookie, getFastApiBase } from "@/lib/auth/auth-cookie-server";

const AUTH_NEXT_COOKIE = "udeets_auth_next";
const OAUTH_STATE_COOKIE = "udeets_oauth_state";
const COOKIE_CLEAR = {
  path: "/",
  maxAge: 0,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
};

function resolvePostAuthPath(request: NextRequest, requestUrl: URL): string {
  const fromQuery = requestUrl.searchParams.get("next");
  const fromCookie = request.cookies.get(AUTH_NEXT_COOKIE)?.value;
  if (fromCookie) {
    try {
      return sanitizeAuthNextPath(decodeURIComponent(fromCookie));
    } catch {
      /* fall through */
    }
  }
  return sanitizeAuthNextPath(fromQuery);
}

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const oauthError = requestUrl.searchParams.get("error");
  const oauthErrorDescription = requestUrl.searchParams.get("error_description");
  const code = requestUrl.searchParams.get("code");
  const state = requestUrl.searchParams.get("state");
  const next = resolvePostAuthPath(request, requestUrl);

  if (oauthError) {
    const detail =
      oauthErrorDescription?.replace(/_/g, " ") ||
      oauthError.replace(/_/g, " ");
    return NextResponse.redirect(
      new URL(`/auth?error=${encodeURIComponent(detail)}`, requestUrl.origin),
    );
  }

  if (!code) {
    return NextResponse.redirect(
      new URL(
        "/auth?error=Sign-in could not be completed. Missing authorization code.",
        requestUrl.origin,
      ),
    );
  }

  const storedState = request.cookies.get(OAUTH_STATE_COOKIE)?.value;
  if (!state || !storedState || state !== storedState) {
    return NextResponse.redirect(
      new URL("/auth?error=Sign-in could not be completed. Invalid OAuth state.", requestUrl.origin),
    );
  }

  let tokenBody: {
    accessToken?: string;
    user?: {
      verificationComplete?: boolean;
    };
    error?: string;
    detail?: string;
  } = {};

  try {
    const tokenResponse = await fetch(`${getFastApiBase()}/api/v1/auth/google/callback`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
      cache: "no-store",
    });
    tokenBody = (await tokenResponse.json()) as typeof tokenBody;
    if (!tokenResponse.ok || !tokenBody.accessToken) {
      const detail =
        (typeof tokenBody.detail === "string" && tokenBody.detail) ||
        (typeof tokenBody.error === "string" && tokenBody.error) ||
        "Token exchange failed";
      return NextResponse.redirect(
        new URL(`/auth?error=${encodeURIComponent(detail)}`, requestUrl.origin),
      );
    }
  } catch {
    return NextResponse.redirect(
      new URL("/auth?error=Sign-in could not be completed.", requestUrl.origin),
    );
  }

  const destination = tokenBody.user?.verificationComplete
    ? next
    : "/auth/verify";

  const redirectResponse = NextResponse.redirect(new URL(destination, requestUrl.origin));
  redirectResponse.cookies.set(AUTH_NEXT_COOKIE, "", COOKIE_CLEAR);
  redirectResponse.cookies.set(OAUTH_STATE_COOKIE, "", COOKIE_CLEAR);
  redirectResponse.cookies.set("udeets_id_token", "", COOKIE_CLEAR);
  applyAuthCookie(redirectResponse, tokenBody.accessToken ?? "");
  return redirectResponse;
}
