import { createClient } from "@/lib/supabase/client";

export async function signInWithGoogle(): Promise<void> {
  if (typeof window === "undefined") {
    throw new Error("Google sign-in must be started from the browser.");
  }

  const supabase = createClient();
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
    },
  });

  if (error) {
    throw new Error(`Failed to sign in with Google: ${error.message}`);
  }
}
