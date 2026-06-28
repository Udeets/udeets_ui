import { NextResponse, type NextRequest } from "next/server";
import { buildGoogleAuthorizeUrl } from "@/lib/auth/google-oauth";
import { sanitizeAuthNextPath } from "@/lib/auth/auth-callback-utils";

const OAUTH_STATE_COOKIE = "udeets_oauth_state";
const AUTH_NEXT_COOKIE = "udeets_auth_next";
const COOKIE_OPTIONS = {
  path: "/",
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  httpOnly: true,
  maxAge: 600,
};

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const next = sanitizeAuthNextPath(requestUrl.searchParams.get("next"));
  const state = crypto.randomUUID();
  const authorizeUrl = buildGoogleAuthorizeUrl(state, requestUrl.origin);

  const response = NextResponse.redirect(authorizeUrl);
  response.cookies.set(OAUTH_STATE_COOKIE, state, COOKIE_OPTIONS);
  response.cookies.set(AUTH_NEXT_COOKIE, encodeURIComponent(next), COOKIE_OPTIONS);
  return response;
}
