// app/auth/page.tsx
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { UdeetsBrandLockup } from "@/components/brand-logo";
import { setMockSession, useMockAuth } from "@/lib/mock-auth";

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
      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
    </svg>
  );
}

export default function Page() {
  const router = useRouter();
  const { homeHref } = useMockAuth();
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState("");

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (mode !== "signin") {
      alert("Sign up (mock)");
      return;
    }

    if (email === "demo@udeets.com" && password === "Demo@123") {
      setError("");
      setMockSession();
      router.push("/dashboard");
      return;
    }

    setError("Invalid demo credentials");
  }

  const PAGE_BG = "bg-[#E3F1EF]";
  const HEADER_BG = "bg-white border-b border-slate-200/60";
  const FOOTER_BG = "bg-[#0C5C57]";
  const NAV_TEXT = "text-[#111111]";
  const BRAND_TEXT_STYLE = "text-xl sm:text-2xl";
  const BUTTON_PRIMARY = "rounded-full bg-[#0C5C57] px-6 py-3 text-sm font-medium text-white hover:bg-[#094a46]";
  const SURFACE = "rounded-2xl border border-slate-100 bg-white shadow-sm";

  return (
    <div className={cx("min-h-screen", PAGE_BG)}>
      {/* HEADER */}
      <header className={cx("sticky top-0 z-50", HEADER_BG)}>
        <div className="flex min-h-16 w-full items-center justify-between px-4 py-2 sm:px-6 lg:px-10">
          <Link href="/" className="flex min-w-0 items-center gap-2 sm:gap-3">
            <UdeetsBrandLockup textClassName={BRAND_TEXT_STYLE} priority />
          </Link>

          <nav className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/discover"
              className={`rounded-full px-4 py-2 text-sm font-medium ${NAV_TEXT} transition hover:bg-slate-100 sm:px-5 sm:py-2.5`}
            >
              Discover
            </Link>
            <Link
              href={homeHref}
              className={`rounded-full px-4 py-2 text-sm font-medium ${NAV_TEXT} transition hover:bg-slate-100 sm:px-5 sm:py-2.5`}
            >
              Home
            </Link>
          </nav>
        </div>
      </header>

      {/* MAIN */}
      <main className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-7xl items-center justify-center px-4 py-10 sm:px-6 lg:px-10">
        <div className={cx(SURFACE, "w-full max-w-md p-6 sm:p-8")}>
          <div className="mb-8 text-center">
            <UdeetsBrandLockup className="mb-2 justify-center" textClassName="text-3xl" showIcon={false} />
            <p className="text-gray-600">Create. Subscribe. Stay Informed.</p>
          </div>

          {/* Toggle */}
          <div className="mb-6">
            <div className="flex bg-gray-100 rounded-xl p-1">
              <button
                type="button"
                onClick={() => setMode("signin")}
                className={cx(
                  "flex-1 py-2 px-4 text-sm font-medium rounded-lg transition",
                  mode === "signin"
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                )}
              >
                Sign in
              </button>
              <button
                type="button"
                onClick={() => setMode("signup")}
                className={cx(
                  "flex-1 py-2 px-4 text-sm font-medium rounded-lg transition",
                  mode === "signup"
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                )}
              >
                Sign up
              </button>
            </div>
          </div>

          {/* Social */}
          <div className="mb-6 space-y-3">
            <button className="w-full flex items-center justify-center px-4 py-3 border border-slate-200 rounded-xl bg-white hover:bg-slate-50 transition">
              <GoogleIcon className="w-5 h-5 mr-3" />
              Continue with Google
            </button>
            <button className="w-full flex items-center justify-center px-4 py-3 border border-slate-200 rounded-xl bg-white hover:bg-slate-50 transition">
              <AppleIcon className="w-5 h-5 mr-3 text-gray-900" />
              Continue with Apple
            </button>
          </div>

          {/* Divider */}
          <div className="mb-6 relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">OR</span>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={onSubmit} className="space-y-4">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              className="w-full rounded-xl border border-gray-300 px-3 py-3 focus:ring-2 focus:ring-[#A9D1CA]"
            />

            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full rounded-xl border border-gray-300 px-3 py-3 focus:ring-2 focus:ring-[#A9D1CA]"
            />

            {error && <p className="text-sm text-red-600">{error}</p>}

            {mode === "signin" && (
              <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-[#0C5C57]"
                  />
                  <span className="ml-2 text-sm text-gray-700">Remember me</span>
                </label>
                <button type="button" className="text-sm text-[#0C5C57]">
                  Forgot password?
                </button>
              </div>
            )}

            <button
              type="submit"
              className={cx(BUTTON_PRIMARY, "w-full")}
            >
              {mode === "signin" ? "Sign In" : "Create Account"}
            </button>

            <p className="text-xs text-center text-gray-500 mt-4">
              By continuing, I agree to the{" "}
              <a href="#" className="text-[#0C5C57]">
                Terms & Conditions
              </a>{" "}
              and{" "}
              <a href="#" className="text-[#0C5C57]">
                Privacy Policy
              </a>
              .
            </p>
          </form>
        </div>
      </main>

      <footer className={FOOTER_BG}>
        <div className="flex min-h-16 w-full items-center justify-between px-4 py-3 text-white sm:px-6 lg:px-10">
          <p className="text-sm sm:text-base">© uDeets. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
