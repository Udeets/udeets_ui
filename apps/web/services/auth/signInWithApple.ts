import { createClient } from "@/lib/supabase/client";
import { getAuthCallbackUrl } from "@/lib/auth/auth-next-cookie";

export async function signInWithApple() {
  const supabase = createClient();
  const redirectTo = getAuthCallbackUrl();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "apple",
    options: {
      redirectTo,
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
