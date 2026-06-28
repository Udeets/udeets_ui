export async function signInWithGoogle(postAuthRedirect?: string): Promise<void> {
  if (typeof window === "undefined") {
    throw new Error("Google sign-in must be started from the browser.");
  }

  const next = postAuthRedirect?.trim() || "/dashboard";
  window.location.assign(`/auth/google?next=${encodeURIComponent(next)}`);
}
