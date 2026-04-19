"use client";

import { useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthSession } from "@/services/auth/useAuthSession";
import { useProfileSync } from "@/services/auth/useProfileSync";
import { useIdleTimeout } from "@/services/auth/useIdleTimeout";
import { signOut as signOutUser } from "@/services/auth/signOut";

/**
 * Wraps a page that requires authentication.
 * Redirects to /auth if the user is not logged in.
 * Shows nothing while checking auth status (prevents flash).
 *
 * Also enforces an idle-session timeout: after 30 minutes of no user activity
 * a warning modal appears; if the user doesn't click "Stay signed in" within
 * 60 seconds, they are signed out and bounced to /auth.
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

  const handleIdleSignOut = useCallback(async () => {
    try {
      await signOutUser();
    } finally {
      const currentPath = typeof window !== "undefined" ? window.location.pathname : "/";
      router.replace(`/auth?redirect=${encodeURIComponent(currentPath)}&reason=idle`);
    }
  }, [router]);

  const { isWarningOpen, secondsUntilSignOut, stayActive } = useIdleTimeout({
    enabled: isAuthenticated,
    idleTimeoutMs: 30 * 60 * 1000, // 30 min total inactivity window
    warningDurationMs: 60 * 1000,  // 60 sec warning before sign-out
    onIdleSignOut: handleIdleSignOut,
  });

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--ud-bg-page)]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--ud-brand-primary)] border-t-transparent" />
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <>
      {children}

      {isWarningOpen ? (
        <div
          className="fixed inset-0 z-[300] flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="idle-warning-title"
        >
          <div className="w-full max-w-sm rounded-2xl bg-[var(--ud-bg-card)] p-6 shadow-xl">
            <h2 id="idle-warning-title" className="text-lg font-semibold text-[var(--ud-text-primary)]">
              Still there?
            </h2>
            <p className="mt-2 text-sm text-[var(--ud-text-secondary)]">
              You&apos;ve been inactive for a while. For your security, we&apos;ll sign you out in{" "}
              <span className="font-semibold text-[var(--ud-text-primary)]">
                {secondsUntilSignOut} second{secondsUntilSignOut === 1 ? "" : "s"}
              </span>
              .
            </p>
            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={handleIdleSignOut}
                className="rounded-full border border-[var(--ud-border)] px-4 py-2 text-sm font-medium text-[var(--ud-text-secondary)] transition hover:bg-[var(--ud-bg-subtle)]"
              >
                Sign out
              </button>
              <button
                type="button"
                onClick={stayActive}
                className="rounded-full bg-gradient-to-r from-[var(--ud-gradient-from)] to-[var(--ud-gradient-to)] px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
                autoFocus
              >
                Stay signed in
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
