// app/auth/page.tsx
"use client";

export const dynamic = "force-dynamic";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { UdeetsBrandLockup } from "@/components/brand-logo";

import { getCurrentSession } from "@/services/auth/getCurrentSession";
import { signInWithGoogle } from "@/services/auth/signInWithGoogle";
import { useAuthSession } from "@/services/auth/useAuthSession";
import { readPostAuthRedirect } from "@/lib/services/hubs/invite-landing-utils";

type Mode = "signin" | "signup";

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function GoogleIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" {...props}>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

function AuthPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryError = searchParams.get("error") ?? "";
  const postAuthRedirect = readPostAuthRedirect(searchParams);
  const initialMode = searchParams.get("mode") === "signup" ? "signup" : "signin";
  const { isAuthenticated } = useAuthSession();
  const [mode, setMode] = useState<Mode>(initialMode);
  const [error, setError] = useState("");
  const [dismissedQueryError, setDismissedQueryError] = useState<string | null>(null);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const visibleError = error || (queryError && dismissedQueryError !== queryError ? queryError : "");

  useEffect(() => {
    const oauthCode = searchParams.get("code");
    if (oauthCode) {
      const callback = new URL("/auth/callback", window.location.origin);
      callback.searchParams.set("code", oauthCode);
      const state = searchParams.get("state");
      if (state) callback.searchParams.set("state", state);
      callback.searchParams.set("next", postAuthRedirect);
      router.replace(callback.pathname + callback.search);
      return;
    }
  }, [searchParams, postAuthRedirect, router]);

  useEffect(() => {
    let cancelled = false;

    async function checkSession() {
      try {
        const session = await getCurrentSession();

        if (!cancelled && session) {
          router.replace(postAuthRedirect);
        }
      } catch {
        // Keep the auth page usable even if session lookup fails.
      }
    }

    void checkSession();

    return () => {
      cancelled = true;
    };
  }, [router, postAuthRedirect, searchParams]);

  async function handleGoogleSignIn() {
    setDismissedQueryError(queryError);
    setError("");
    setIsGoogleLoading(true);

    try {
      await signInWithGoogle(postAuthRedirect);
    } catch (signInError) {
      setError(signInError instanceof Error ? signInError.message : "Failed to sign in with Google.");
      setIsGoogleLoading(false);
    }
  }

  const SURFACE = "rounded-2xl border border-[var(--ud-border-subtle)] bg-[var(--ud-bg-card)] shadow-sm";

  return (
    <div className="min-h-screen bg-[var(--ud-bg-page)]">
      <header className="sticky top-0 z-50 border-b border-[var(--ud-border-subtle)] bg-[var(--ud-bg-page)]/80 backdrop-blur-lg">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-10">
          <div className="flex items-center gap-2 sm:gap-4">
            <Link href="/" className="flex min-w-0 items-center gap-2 sm:gap-3">
              <UdeetsBrandLockup textClassName="text-xl sm:text-2xl" priority />
            </Link>
            <Link
              href="/about"
              className="hidden rounded-full px-3 py-2 text-sm font-medium text-[var(--ud-text-secondary)] transition hover:bg-[var(--ud-bg-subtle)] hover:text-[var(--ud-text-primary)] sm:inline-flex"
            >
              About
            </Link>
          </div>

          <nav className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/discover"
              className="rounded-full px-3 py-2 text-sm font-medium text-[var(--ud-text-secondary)] transition hover:bg-[var(--ud-bg-subtle)] hover:text-[var(--ud-text-primary)]"
            >
              Discover
            </Link>
            <Link
              href={isAuthenticated ? "/dashboard" : "/"}
              className="inline-flex items-center rounded-full border border-[var(--ud-border)] px-4 py-2 text-sm font-medium text-[var(--ud-text-primary)] transition hover:bg-[var(--ud-bg-subtle)]"
            >
              {isAuthenticated ? "Dashboard" : "Back to home"}
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-7xl items-center justify-center px-4 py-10 sm:px-6 lg:px-10">
        <div className={cx(SURFACE, "w-full max-w-md p-6 sm:p-8")}>
          <div className="mb-8 text-center">
            <UdeetsBrandLockup className="mb-2 justify-center" textClassName="text-3xl" showIcon={false} />
            <p className="text-[var(--ud-text-secondary)]">Create. Subscribe. Stay Informed.</p>
          </div>

          {/* Sign in / Sign up toggle */}
          <div className="mb-6">
            <div className="flex rounded-xl bg-[var(--ud-bg-subtle)] p-1">
              <button
                type="button"
                onClick={() => { setMode("signin"); setError(""); setDismissedQueryError(queryError); }}
                className={cx(
                  "flex-1 py-2 px-4 text-sm font-medium rounded-lg transition",
                  mode === "signin"
                    ? "bg-[var(--ud-bg-card)] text-[var(--ud-text-primary)] shadow-sm"
                    : "text-[var(--ud-text-muted)] hover:text-[var(--ud-text-primary)]",
                )}
              >
                Sign in
              </button>
              <button
                type="button"
                onClick={() => { setMode("signup"); setError(""); setDismissedQueryError(queryError); }}
                className={cx(
                  "flex-1 py-2 px-4 text-sm font-medium rounded-lg transition",
                  mode === "signup"
                    ? "bg-[var(--ud-bg-card)] text-[var(--ud-text-primary)] shadow-sm"
                    : "text-[var(--ud-text-muted)] hover:text-[var(--ud-text-primary)]",
                )}
              >
                Sign up
              </button>
            </div>
          </div>

          <div className="mb-6 text-center">
            <h1 className="text-lg font-semibold text-[var(--ud-text-primary)]">
              {mode === "signup" ? "Create your account" : "Welcome back"}
            </h1>
            <p className="mt-1 text-sm text-[var(--ud-text-secondary)]">
              {mode === "signup"
                ? "Use Google to sign up — we'll save your name and email automatically."
                : "Sign in with your Google account to continue."}
            </p>
          </div>

          <div className="space-y-4">
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isGoogleLoading}
              className="w-full flex items-center justify-center px-4 py-3 border border-[var(--ud-border)] rounded-xl bg-[var(--ud-bg-page)] text-[var(--ud-text-primary)] hover:bg-[var(--ud-bg-subtle)] transition disabled:cursor-not-allowed disabled:opacity-60"
            >
              <GoogleIcon className="w-5 h-5 mr-3" />
              {isGoogleLoading
                ? "Connecting to Google..."
                : mode === "signup"
                  ? "Sign up with Google"
                  : "Continue with Google"}
            </button>

            {visibleError ? <p className="text-sm text-red-600 text-center">{visibleError}</p> : null}

            <p className="text-xs text-center text-[var(--ud-text-muted)]">
              By continuing, I agree to the{" "}
              <Link href="/terms" className="text-[var(--ud-brand-primary)] hover:underline">
                Terms & Conditions
              </Link>{" "}
              and{" "}
              <Link href="/privacy" className="text-[var(--ud-brand-primary)] hover:underline">
                Privacy Policy
              </Link>
              .
            </p>
          </div>
        </div>
      </main>

      <footer className="bg-[#0C5C57]">
        <div className="mx-auto flex min-h-16 max-w-7xl items-center justify-between px-4 py-3 text-white sm:px-6 lg:px-10">
          <p className="text-sm sm:text-base">© uDeets. All rights reserved.</p>
          <div className="flex gap-4 text-sm">
            <Link href="/terms" className="hover:underline">Terms</Link>
            <Link href="/privacy" className="hover:underline">Privacy</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={null}>
      <AuthPageContent />
    </Suspense>
  );
}
