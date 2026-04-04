import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { upsertProfile } from "@/lib/services/profile/upsert-profile";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next") || "/dashboard";

  if (!code) {
    return NextResponse.redirect(
      new URL("/auth?error=Google sign-in could not be completed. Missing authorization code.", requestUrl.origin),
    );
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(
      new URL(`/auth?error=${encodeURIComponent(error.message)}`, requestUrl.origin),
    );
  }

  const user = data.session?.user;
  if (user) {
    const meta = user.user_metadata ?? {};
    // Google OAuth may store name under "full_name", "name", or both
    const fullName = (meta.full_name as string) || (meta.name as string) || null;
    await upsertProfile(
      user.id,
      fullName,
      (meta.avatar_url as string) ?? null,
      user.email ?? null,
    );
  }

  return NextResponse.redirect(new URL(next, requestUrl.origin));
}
