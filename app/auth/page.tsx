"use client";

// app/auth/page.tsx
import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type Mode = "login" | "signup";

const GRADIENT = "bg-gradient-to-br from-teal-600 via-cyan-700 to-blue-800";

export default function AuthPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("login");

  const ui = useMemo(() => {
    const isLogin = mode === "login";
    return {
      title: isLogin ? "Log in" : "Create account",
      toggleText: isLogin ? "Sign up" : "Log in",
      submitText: isLogin ? "Log in" : "Sign up",
    };
  }, [mode]);

  function onToggleMode() {
    setMode((m) => (m === "login" ? "signup" : "login"));
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    // frontend-first v0: treat as success
    router.push("/discover");
  }

  function onSocial() {
    // frontend-first v0: treat as success
    router.push("/discover");
  }

  return (
    <main className="bg-white">
      <div className="min-h-screen grid grid-cols-1 lg:grid-cols-[30%_70%]">
        {/* ================= LEFT PANEL (30% GRADIENT) ================= */}
        <section
          className={`${GRADIENT} text-white p-8 lg:p-10 flex flex-col justify-between`}
        >
          <div>
            <div className="flex items-center gap-3 mb-16">
              <Image
                src="/udeets-logo.png"
                alt="uDeets Logo"
                width={48}
                height={48}
                className="h-12 w-12 object-contain"
                priority
              />
              <span className="text-2xl font-bold">uDeets</span>
            </div>

            <h1 className="text-3xl lg:text-4xl font-bold mb-5 leading-tight">
              Discover what&apos;s happening near you.
            </h1>

            <p className="text-white/90 leading-relaxed">
              Join local hubs, follow community updates, and explore what&apos;s
              happening in your neighborhood. Connect with local businesses,
              events, and people that matter to you.
            </p>
          </div>

          <p className="text-sm text-white/80">© 2026 uDeets</p>
        </section>

        {/* ================= RIGHT PANEL (70% WHITE) ================= */}
        <section className="bg-white relative p-8 lg:p-12 flex items-center justify-center">
          {/* Home icon pinned to extreme top-right */}
          <Link
            href="/"
            aria-label="Home"
            className="absolute top-6 right-6 text-gray-600 hover:text-gray-900 transition"
          >
            <IconHome className="h-6 w-6" />
          </Link>

          <div className="w-full max-w-md">
            {/* ================= AUTH CTA BLOCK (GRADIENT BG) ================= */}
            <div
              className={`${GRADIENT} rounded-3xl p-8 lg:p-10 shadow-xl border border-white/20`}
            >
              <header className="flex items-center justify-between mb-8">
                <h2 className="text-3xl font-bold text-white">{ui.title}</h2>
                <button
                  type="button"
                  onClick={onToggleMode}
                  className="text-sm font-medium text-white/90 hover:text-white transition"
                >
                  {ui.toggleText}
                </button>
              </header>

              {/* Social buttons (white fields with logos) */}
              <div className="space-y-3 mb-6">
                <button
                  type="button"
                  onClick={onSocial}
                  className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-white rounded-lg hover:bg-gray-100 transition-colors shadow-sm"
                >
                  {/* Google logo SVG (same as earlier) */}
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    aria-hidden="true"
                  >
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      fill="#EA4335"
                    />
                  </svg>

                  <span className="text-gray-900 font-medium">
                    Continue with Google
                  </span>
                </button>

                <button
                  type="button"
                  onClick={onSocial}
                  className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-white rounded-lg hover:bg-gray-100 transition-colors shadow-sm"
                >
                  {/* Facebook logo SVG (same as earlier) */}
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    aria-hidden="true"
                  >
                    <path
                      d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"
                      fill="#1877F2"
                    />
                  </svg>

                  <span className="text-gray-900 font-medium">
                    Continue with Facebook
                  </span>
                </button>
              </div>

              {/* Divider */}
              <div className="flex items-center gap-4 mb-6">
                <div className="flex-1 h-px bg-white/40" />
                <span className="text-sm text-white/90">or</span>
                <div className="flex-1 h-px bg-white/40" />
              </div>

              {/* Form fields (white) */}
              <form onSubmit={onSubmit} className="space-y-4 mb-6">
                <input
                  type="email"
                  placeholder="Email address"
                  required
                  className="w-full px-4 py-3 bg-white border border-transparent rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5DBFC9]"
                />
                <input
                  type="password"
                  placeholder="Password"
                  required
                  className="w-full px-4 py-3 bg-white border border-transparent rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5DBFC9]"
                />

                {/* Submit button (white, since whole block is gradient) */}
                <button
                  type="submit"
                  className="w-full bg-white text-gray-900 font-semibold py-3 rounded-lg hover:bg-gray-100 transition-colors shadow-md"
                >
                  {ui.submitText}
                </button>
              </form>

              <p className="text-xs text-white/90 text-center leading-relaxed">
                By continuing, you agree to our Terms and Privacy Policy.
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

/* ================= ICON ================= */

function IconHome({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <path
        d="M3 10.5 12 3l9 7.5V21H3V10.5Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M9.5 21v-6h5v6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}