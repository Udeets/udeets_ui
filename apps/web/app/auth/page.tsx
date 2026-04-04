// app/auth/page.tsx
"use client";

export const dynamic = "force-dynamic";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { UdeetsBrandLockup } from "@/components/brand-logo";

import { getCurrentSession } from "@/services/auth/getCurrentSession";
import { signInWithApple } from "@/services/auth/signInWithApple";
import { signInWithGoogle } from "@/services/auth/signInWithGoogle";
import { useAuthSession } from "@/services/auth/useAuthSession";

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

function AppleIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
    </svg>
  );
}

function AuthPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryError = searchParams.get("error") ?? "";
  const { isAuthenticated } = useAuthSession();
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState("");
  const [dismissedQueryError, setDismissedQueryError] = useState<string | null>(null);
  const [fullName, setFullName] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isAppleLoading, setIsAppleLoading] = useState(false);
  const [isEmailLoading, setIsEmailLoading] = useState(false);
  const [signupSuccess, setSignupSuccess] = useState(false);
  const visibleError = error || (queryError && dismissedQueryError !== queryError ? queryError : "");

  useEffect(() => {
    let cancelled = false;

    async function checkSession() {
      try {
        const session = await getCurrentSession();

        if (!cancelled && session) {
          router.replace("/dashboard");
        }
      } catch {
        // Keep the auth page usable even if session lookup fails.
      }
    }

    void checkSession();

    return () => {
      cancelled = true;
    };
  }, [router]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setDismissedQueryError(queryError);
    setError("");

    // --- Validation (#18) ---
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setError("Please enter your email address.");
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      setError("Please enter a valid email address.");
      return;
    }
    if (!password) {
      setError("Please enter a password.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (mode === "signup") {
      if (!fullName.trim()) {
        setError("Please enter your full name.");
        return;
      }
      if (password !== confirmPassword) {
        setError("Passwords do not match.");
        return;
      }
    }

    setIsEmailLoading(true);
    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();

      if (mode === "signup") {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email: trimmedEmail,
          password,
          options: {
            data: { full_name: fullName.trim() },
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        });
        if (signUpError) {
          setError(signUpError.message);
          return;
        }
        // If email confirmation is required, Supabase returns a user but no session
        if (data.user && !data.session) {
          setError("");
          setSignupSuccess(true);
          return;
        }
        // If auto-confirmed, upsert profile and redirect
        if (data.session) {
          router.replace("/dashboard");
        }
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: trimmedEmail,
          password,
        });
        if (signInError) {
          if (signInError.message.includes("Invalid login credentials")) {
            setError("Invalid email or password. Please try again.");
          } else {
            setError(signInError.message);
          }
          return;
        }
        router.replace("/dashboard");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setIsEmailLoading(false);
    }
  }

  async function handleAppleSignIn() {
    setDismissedQueryError(queryError);
    setError("");
    setIsAppleLoading(true);

    try {
      await signInWithApple();
    } catch (signInError) {
      setError(signInError instanceof Error ? signInError.message : "Failed to sign in with Apple.");
      setIsAppleLoading(false);
    }
  }

  async function handleGoogleSignIn() {
    setDismissedQueryError(queryError);
    setError("");
    setIsGoogleLoading(true);

    try {
      await signInWithGoogle();
    } catch (signInError) {
      setError(signInError instanceof Error ? signInError.message : "Failed to sign in with Google.");
      setIsGoogleLoading(false);
    }
  }

  const PAGE_BG = "bg-[var(--ud-bg-page)]";
  const HEADER_BG = "bg-[var(--ud-bg-card)] border-b border-[var(--ud-border-subtle)]";
  const FOOTER_BG = "bg-[#0C5C57]";
  const NAV_TEXT = "text-[var(--ud-text-primary)]";
  const BRAND_TEXT_STYLE = "text-xl sm:text-2xl";
  const BUTTON_PRIMARY = "rounded-full bg-gradient-to-r from-[var(--ud-gradient-from)] to-[var(--ud-gradient-to)] px-6 py-3 text-sm font-medium text-white hover:opacity-90";
  const SURFACE = "rounded-2xl border border-[var(--ud-border-subtle)] bg-[var(--ud-bg-card)] shadow-sm";

  return (
    <div className={cx("min-h-screen", PAGE_BG)}>
      {/* HEADER */}
      <header className={cx("sticky top-0 z-50", HEADER_BG)}>
        <div className="flex min-h-16 w-full items-center justify-between px-4 py-2 sm:px-6 lg:px-10">
          <Link href="/" className="flex min-w-0 items-center gap-2 sm:gap-3">
            <UdeetsBrandLockup textClassName={BRAND_TEXT_STYLE} priority />
          </Link>

          <nav className="flex items-center gap-1 sm:gap-1.5">
            <Link
              href="/discover"
              className="flex h-9 w-9 items-center justify-center rounded-full text-[var(--ud-text-muted)] transition hover:bg-[var(--ud-bg-subtle)] hover:text-[var(--ud-text-primary)]"
              aria-label="Discover"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.3-4.3" />
              </svg>
            </Link>
            <Link
              href={isAuthenticated ? "/dashboard" : "/"}
              className="flex h-9 w-9 items-center justify-center rounded-full text-[var(--ud-text-muted)] transition hover:bg-[var(--ud-bg-subtle)] hover:text-[var(--ud-text-primary)]"
              aria-label="Home"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
            </Link>
          </nav>
        </div>
      </header>

      {/* MAIN */}
      <main className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-7xl items-center justify-center px-4 py-10 sm:px-6 lg:px-10">
        <div className={cx(SURFACE, "w-full max-w-md p-6 sm:p-8")}>
          <div className="mb-8 text-center">
            <UdeetsBrandLockup className="mb-2 justify-center" textClassName="text-3xl" showIcon={false} />
            <p className="text-[var(--ud-text-secondary)]">Create. Subscribe. Stay Informed.</p>
          </div>

          {/* Toggle */}
          <div className="mb-6">
            <div className="flex rounded-xl bg-[var(--ud-bg-subtle)] p-1">
              <button
                type="button"
                onClick={() => { setMode("signin"); setError(""); setSignupSuccess(false); }}
                className={cx(
                  "flex-1 py-2 px-4 text-sm font-medium rounded-lg transition",
                  mode === "signin"
                    ? "bg-[var(--ud-bg-card)] text-[var(--ud-text-primary)] shadow-sm"
                    : "text-[var(--ud-text-muted)] hover:text-[var(--ud-text-primary)]"
                )}
              >
                Sign in
              </button>
              <button
                type="button"
                onClick={() => { setMode("signup"); setError(""); setSignupSuccess(false); }}
                className={cx(
                  "flex-1 py-2 px-4 text-sm font-medium rounded-lg transition",
                  mode === "signup"
                    ? "bg-[var(--ud-bg-card)] text-[var(--ud-text-primary)] shadow-sm"
                    : "text-[var(--ud-text-muted)] hover:text-[var(--ud-text-primary)]"
                )}
              >
                Sign up
              </button>
            </div>
          </div>

          {/* Social */}
          <div className="mb-6 space-y-3">
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isGoogleLoading || isAppleLoading}
              className="w-full flex items-center justify-center px-4 py-3 border border-[var(--ud-border)] rounded-xl bg-[var(--ud-bg-page)] text-[var(--ud-text-primary)] hover:bg-[var(--ud-bg-subtle)] transition disabled:cursor-not-allowed disabled:opacity-60"
            >
              <GoogleIcon className="w-5 h-5 mr-3" />
              {isGoogleLoading ? "Connecting to Google..." : "Continue with Google"}
            </button>
            <button
              type="button"
              onClick={handleAppleSignIn}
              disabled={isGoogleLoading || isAppleLoading}
              className="w-full flex items-center justify-center px-4 py-3 border border-[var(--ud-border)] rounded-xl bg-black text-white hover:bg-gray-900 transition disabled:cursor-not-allowed disabled:opacity-60"
            >
              <AppleIcon className="w-5 h-5 mr-3" />
              {isAppleLoading ? "Connecting to Apple..." : "Continue with Apple"}
            </button>
          </div>

          {/* Divider */}
          <div className="mb-6 relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[var(--ud-border)]" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-[var(--ud-bg-card)] text-[var(--ud-text-muted)]">OR</span>
            </div>
          </div>

          {/* Form */}
          {signupSuccess ? (
            <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-center">
              <p className="text-sm font-medium text-green-800">Check your email!</p>
              <p className="mt-1 text-sm text-green-700">
                We sent a confirmation link to <strong>{email}</strong>. Click it to activate your account.
              </p>
            </div>
          ) : (
          <form onSubmit={onSubmit} className="space-y-4">
            {mode === "signup" && (
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Full Name"
                className="w-full rounded-xl border border-[var(--ud-border)] bg-[var(--ud-bg-input)] px-3 py-3 text-[var(--ud-text-primary)] placeholder:text-[var(--ud-text-muted)] focus:ring-2 focus:ring-[#A9D1CA] outline-none"
              />
            )}

            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              className="w-full rounded-xl border border-[var(--ud-border)] bg-[var(--ud-bg-input)] px-3 py-3 text-[var(--ud-text-primary)] placeholder:text-[var(--ud-text-muted)] focus:ring-2 focus:ring-[#A9D1CA] outline-none"
            />

            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full rounded-xl border border-[var(--ud-border)] bg-[var(--ud-bg-input)] px-3 py-3 text-[var(--ud-text-primary)] placeholder:text-[var(--ud-text-muted)] focus:ring-2 focus:ring-[#A9D1CA] outline-none"
            />

            {mode === "signup" && (
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm Password"
                className="w-full rounded-xl border border-[var(--ud-border)] bg-[var(--ud-bg-input)] px-3 py-3 text-[var(--ud-text-primary)] placeholder:text-[var(--ud-text-muted)] focus:ring-2 focus:ring-[#A9D1CA] outline-none"
              />
            )}

            {visibleError && <p className="text-sm text-red-600">{visibleError}</p>}

            {mode === "signin" && (
              <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-[var(--ud-brand-primary)]"
                  />
                  <span className="ml-2 text-sm text-[var(--ud-text-secondary)]">Remember me</span>
                </label>
                <button type="button" className="text-sm text-[var(--ud-brand-primary)]">
                  Forgot password?
                </button>
              </div>
            )}

            <button
              type="submit"
              disabled={isEmailLoading}
              className={cx(BUTTON_PRIMARY, "w-full disabled:cursor-not-allowed disabled:opacity-60")}
            >
              {isEmailLoading
                ? "Please wait..."
                : mode === "signin"
                  ? "Sign In"
                  : "Create Account"}
            </button>

            <p className="text-xs text-center text-[var(--ud-text-muted)] mt-4">
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
          </form>
          )}
        </div>
      </main>

      <footer className={FOOTER_BG}>
        <div className="flex min-h-16 w-full items-center justify-between px-4 py-3 text-white sm:px-6 lg:px-10">
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
