import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { sanitizeAuthNextPath } from "@/lib/auth/auth-callback-utils";
import { getSupabasePublishableOrAnonKey, getSupabaseUrl } from "@/lib/supabase/env";
import { upsertProfile } from "@/lib/services/profile/upsert-profile";

const AUTH_NEXT_COOKIE = "udeets_auth_next";

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
  const code = requestUrl.searchParams.get("code");
  const next = resolvePostAuthPath(request, requestUrl);

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

  const supabase = createServerClient(getSupabaseUrl(), getSupabasePublishableOrAnonKey(), {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          redirectResponse.cookies.set(name, value, options);
        });
      },
    },
  });

  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(
      new URL(`/auth?error=${encodeURIComponent(error.message)}`, requestUrl.origin),
    );
  }

  const user = data.session?.user;
  if (user) {
    const meta = user.user_metadata ?? {};
    const fullName = (meta.full_name as string) || (meta.name as string) || null;
    await upsertProfile(
      user.id,
      fullName,
      (meta.avatar_url as string) ?? null,
      user.email ?? null,
      supabase,
    );
  }

  return redirectResponse;
}
