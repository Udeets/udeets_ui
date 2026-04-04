"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthSession } from "@/services/auth/useAuthSession";
import { useProfileSync } from "@/services/auth/useProfileSync";

/**
 * Wraps a page that requires authentication.
 * Redirects to /auth if the user is not logged in.
 * Shows nothing while checking auth status (prevents flash).
 */
export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { status, isAuthenticated, user } = useAuthSession();
  useProfileSync(user);
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace(`/auth?redirect=${encodeURIComponent(window.location.pathname)}`);
    }
  }, [status, router]);

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--ud-bg-page)]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--ud-brand-primary)] border-t-transparent" />
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return <>{children}</>;
}
