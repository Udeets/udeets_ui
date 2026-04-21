import { createClient } from "@/lib/supabase/client";

/**
 * Initiate Apple OAuth sign-in via Supabase.
 *
 * Prerequisites:
 *  1. Apple Developer account with "Sign In with Apple" capability enabled
 *  2. Service ID configured in Apple Developer portal
 *  3. Supabase Dashboard → Auth → Providers → Apple enabled with:
 *     - Client ID (Service ID)
 *     - Secret Key (p8 key file content)
 *     - Key ID
 *     - Team ID
 *  4. Redirect URL added in Apple Developer: <supabase-url>/auth/v1/callback
 */
export async function signInWithApple() {
  const supabase = createClient();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "apple",
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
    },
  });

  if (error) {
    throw error;
  }

  if (data?.url) {
    window.location.assign(data.url);
    return;
  }

  throw new Error(
    "Apple sign-in did not return a redirect URL. Confirm Supabase URL settings and Apple provider configuration.",
  );
}
