import { NextResponse, type NextRequest } from "next/server";
import { buildAuthCallbackHref, buildNextFromRequestUrl } from "@/lib/auth/auth-callback-utils";

/** Cognito OAuth: forward `?code=` to `/auth/callback` when it lands on a non-callback path. */
export async function updateSession(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const pathname = request.nextUrl.pathname;

  if (code && pathname !== "/auth/callback") {
    const next = buildNextFromRequestUrl(request.nextUrl);
    return NextResponse.redirect(buildAuthCallbackHref(request.nextUrl.origin, code, next));
  }

  return NextResponse.next({
    request,
  });
}
