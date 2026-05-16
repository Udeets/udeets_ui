import { createClient } from "@/lib/supabase/client";
import { getAuthCallbackUrl } from "@/lib/auth/auth-next-cookie";

/**
 * Google OAuth via Supabase.
 *
 * Uses an exact `redirectTo` of `{origin}/auth/callback` (no query params) so it matches
 * Supabase Redirect URLs like `http://localhost:3000/auth/callback`.
 * Intended destination is stored in `udeets_auth_next` cookie before redirect.
 *
 * Supabase dashboard:
 *  - Site URL: your primary app URL (e.g. production). For local-only testing you may set
 *    `http://localhost:3000` temporarily, or rely on Redirect URLs below.
 *  - Redirect URLs must include BOTH production and local, e.g.:
 *      https://udeets-ui-web.vercel.app/auth/callback
 *      http://localhost:3000/auth/callback
 *      http://127.0.0.1:3000/auth/callback
 */
export async function signInWithGoogle(): Promise<void> {
  if (typeof window === "undefined") {
    throw new Error("Google sign-in must be started from the browser.");
  }

  const supabase = createClient();
  const redirectTo = getAuthCallbackUrl();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo,
    },
  });

  if (error) {
    throw new Error(`Failed to sign in with Google: ${error.message}`);
  }

  if (data?.url) {
    window.location.assign(data.url);
    return;
  }

  throw new Error(
    "Google sign-in did not return a redirect URL. Confirm Supabase URL settings and that the Google provider is enabled.",
  );
}
