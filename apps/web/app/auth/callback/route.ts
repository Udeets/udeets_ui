import { NextResponse, type NextRequest } from "next/server";
import { getCognitoClientId, getCognitoDomain, getCognitoRedirectUri } from "@/lib/auth/cognito";
import { decodeJwtPayload } from "@/lib/auth/cognito-session";
import { sanitizeAuthNextPath } from "@/lib/auth/auth-callback-utils";
import { upsertProfile } from "@/lib/services/profile/upsert-profile";

const AUTH_NEXT_COOKIE = "udeets_auth_next";
const COOKIE_OPTIONS = {
  path: "/",
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

  const redirectResponse = NextResponse.redirect(new URL(next, requestUrl.origin));
  redirectResponse.cookies.set(AUTH_NEXT_COOKIE, "", { path: "/", maxAge: 0 });

  let tokenBody: {
    access_token?: string;
    id_token?: string;
    expires_in?: number;
    error?: string;
    error_description?: string;
  } = {};

  try {
    const params = new URLSearchParams({
      grant_type: "authorization_code",
      client_id: getCognitoClientId(),
      code,
      redirect_uri: getCognitoRedirectUri(requestUrl.origin),
    });
    const tokenResponse = await fetch(`${getCognitoDomain()}/oauth2/token`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString(),
      cache: "no-store",
    });
    tokenBody = (await tokenResponse.json()) as typeof tokenBody;
    if (!tokenResponse.ok || !tokenBody.access_token) {
      const detail = tokenBody.error_description || tokenBody.error || "Token exchange failed";
      return NextResponse.redirect(
        new URL(`/auth?error=${encodeURIComponent(detail)}`, requestUrl.origin),
      );
    }
  } catch {
    return NextResponse.redirect(
      new URL("/auth?error=Sign-in could not be completed.", requestUrl.origin),
    );
  }

  const expiresIn = tokenBody.expires_in ?? 3600;
  redirectResponse.cookies.set("udeets_access_token", tokenBody.access_token ?? "", {
    ...COOKIE_OPTIONS,
    maxAge: expiresIn,
  });
  if (tokenBody.id_token) {
    redirectResponse.cookies.set("udeets_id_token", tokenBody.id_token, {
      ...COOKIE_OPTIONS,
      maxAge: expiresIn,
    });
  }

  const claims = tokenBody.id_token ? decodeJwtPayload(tokenBody.id_token) : null;
  const userId = typeof claims?.sub === "string" ? claims.sub : null;
  if (userId) {
    const fullName =
      (typeof claims?.name === "string" && claims.name) ||
      (typeof claims?.given_name === "string" && claims.given_name) ||
      null;
    const avatarUrl = typeof claims?.picture === "string" ? claims.picture : null;
    const email = typeof claims?.email === "string" ? claims.email : null;
    await upsertProfile(
      userId,
      fullName,
      avatarUrl,
      email,
      tokenBody.access_token ?? null,
    );
  }

  return redirectResponse;
}
