import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { buildAuthCallbackHref, buildNextFromRequestUrl } from "@/lib/auth/auth-callback-utils";
import { getSupabasePublishableOrAnonKey, getSupabaseUrl } from "@/lib/supabase/env";

export async function updateSession(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const pathname = request.nextUrl.pathname;

  // OAuth/PKCE often lands on Site URL or redirect_to path with ?code= — route through callback.
  if (code && pathname !== "/auth/callback") {
    const next = buildNextFromRequestUrl(request.nextUrl);
    return NextResponse.redirect(buildAuthCallbackHref(request.nextUrl.origin, code, next));
  }

  let response = NextResponse.next({
    request,
  });

  let supabaseUrl: string;
  let supabaseKey: string;
  try {
    supabaseUrl = getSupabaseUrl();
    supabaseKey = getSupabasePublishableOrAnonKey();
  } catch {
    return response;
  }

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });

        response = NextResponse.next({
          request,
        });

        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  await supabase.auth.getUser();

  return response;
}
