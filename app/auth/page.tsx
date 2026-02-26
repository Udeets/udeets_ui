// app/auth/page.tsx
"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

type Mode = "signin" | "signup";

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function GoogleIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" {...props}>
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  );
}

function AppleIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
    </svg>
  );
}

export default function Page() {
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    alert(mode === "signin" ? "Sign in (mock)" : "Sign up (mock)");
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-600 to-cyan-700">

      {/* HEADER — EXACTLY LIKE HOMEPAGE */}
      <header className="sticky top-0 z-50 bg-gradient-to-br from-teal-600 to-cyan-700 shadow-md">
        <div className="flex h-16 items-center justify-between px-6 lg:px-10">
          
          {/* Left: Logo */}
          <Link href="/" className="flex items-center gap-3">
            <div className="relative h-10 w-10">
              <Image
                src="/udeets-logo.png"
                alt="uDeets Logo"
                fill
                className="object-contain"
                priority
              />
            </div>
            <span className="text-2xl font-bold text-white">uDeets</span>
          </Link>

          {/* Right: Navigation */}
          <nav className="flex items-center gap-6">
            <Link
              href="/discover"
              className="text-white font-semibold hover:bg-white/10 px-4 py-2 rounded-lg transition"
            >
              Discover
            </Link>
            <Link
              href="/"
              className="text-white font-semibold hover:bg-white/10 px-4 py-2 rounded-lg transition"
            >
              Home
            </Link>
          </nav>
        </div>
      </header>

      {/* MAIN */}
      <main className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 w-full max-w-md">
          
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">uDeets</h1>
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
              <div className="w-full border-t border-gray-300"></div>
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
              className="w-full px-3 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500"
            />

            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full px-3 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500"
            />

            {mode === "signin" && (
              <div className="flex items-center justify-between">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="h-4 w-4 text-teal-600 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">Remember me</span>
                </label>
                <button type="button" className="text-sm text-teal-600">
                  Forgot password?
                </button>
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-teal-600 text-white py-3 px-4 rounded-xl hover:bg-teal-700 transition font-medium"
            >
              {mode === "signin" ? "Sign In" : "Create Account"}
            </button>

            <p className="text-xs text-center text-gray-500 mt-4">
              By continuing, I agree to the{" "}
              <a href="#" className="text-teal-600">Terms & Conditions</a> and{" "}
              <a href="#" className="text-teal-600">Privacy Policy</a>.
            </p>
          </form>
        </div>
      </main>

      {/* Footer */}
      <footer className="fixed bottom-4 left-4">
        <p className="text-white/80 text-xs">© uDeets. All rights reserved.</p>
      </footer>
    </div>
  );
}