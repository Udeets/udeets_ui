import { createClient } from "@/lib/supabase/client";

/**
 * Google OAuth via Supabase.
 *
 * Dashboard checklist:
 *  - Supabase → Authentication → Providers → **Google** enabled (Web client ID + secret from Google Cloud).
 *  - Supabase → Authentication → URL configuration → **Site URL** = your app origin (e.g. http://localhost:3000).
 *  - Same screen → **Redirect URLs** must include `{origin}/auth/callback` (e.g. http://localhost:3000/auth/callback).
 *  - Google Cloud Console → APIs & Services → Credentials → OAuth 2.0 Client → **Authorized redirect URIs**:
 *    `https://<YOUR_PROJECT_REF>.supabase.co/auth/v1/callback` (Supabase’s callback, not your Next route).
 */
export async function signInWithGoogle(): Promise<void> {
  if (typeof window === "undefined") {
    throw new Error("Google sign-in must be started from the browser.");
  }

  const supabase = createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
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
