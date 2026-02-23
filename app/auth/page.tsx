"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type Mode = "login" | "signup";

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
    router.push("/hub");
  }

  function onSocial() {
    // frontend-first v0: treat as success
    router.push("/hub");
  }

  return (
    <main className="bg-white">
      <div
        id="main-container"
        className="min-h-screen grid grid-cols-1 lg:grid-cols-[40%_60%]"
      >
        {/* Brand Panel */}
        <section
          id="brand-panel"
          className="bg-[#0B6E78] text-white p-8 lg:p-12 flex flex-col justify-between relative"
        >
          <div className="absolute inset-0 bg-black opacity-[0.06]" />

          <div id="brand-header" className="relative z-10">
            <div className="flex items-center gap-3 mb-16">
              {/* IMPORTANT: public assets use "/filename" (no /public) */}
              <Image
                src="/udeets-logo.png"
                alt="uDeets Logo"
                width={80}
                height={40}
                className="h-10 w-auto"
                priority
              />
              <div>
                <div className="text-xl font-semibold">uDeets</div>
              </div>
            </div>
          </div>

          <div id="brand-content" className="relative z-10 max-w-md">
            <h1 className="text-4xl lg:text-5xl font-bold mb-6 leading-tight">
              Discover what&apos;s happening near you.
            </h1>
            <p className="text-lg text-white/90 leading-relaxed">
              Join local hubs, follow community updates, and explore what&apos;s
              happening in your neighborhood. Connect with local businesses,
              events, and people that matter to you.
            </p>
          </div>

          <div id="brand-footer" className="relative z-10">
            <p className="text-sm text-white/70">© 2026 uDeets</p>
          </div>
        </section>

        {/* Auth Panel */}
        <section
          id="auth-panel"
          className="bg-white p-8 lg:p-12 flex items-center justify-center"
        >
          <div
            id="auth-card"
            className="w-full max-w-md bg-white rounded-2xl border border-gray-200 p-8 lg:p-10 shadow-sm"
          >
            <header
              id="auth-header"
              className="flex items-center justify-between mb-8"
            >
              <h2 className="text-3xl font-bold text-gray-900">{ui.title}</h2>
              <button
                type="button"
                onClick={onToggleMode}
                className="text-sm text-[#0B6E78] hover:text-[#5DBFC9] font-medium transition-colors"
              >
                {ui.toggleText}
              </button>
            </header>

            <div id="social-auth" className="space-y-3 mb-6">
              <button
                type="button"
                onClick={onSocial}
                className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                {/* Google icon (SVG from your HTML) */}
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
                <span className="text-gray-700 font-medium">
                  Continue with Google
                </span>
              </button>

              <button
                type="button"
                onClick={onSocial}
                className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                {/* Facebook icon (SVG from your HTML) */}
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
                <span className="text-gray-700 font-medium">
                  Continue with Facebook
                </span>
              </button>
            </div>

            <div id="divider" className="flex items-center gap-4 mb-6">
              <div className="flex-1 h-px bg-gray-300" />
              <span className="text-sm text-gray-500">or</span>
              <div className="flex-1 h-px bg-gray-300" />
            </div>

            <form id="auth-form" onSubmit={onSubmit} className="space-y-4 mb-6">
              <div>
                <input
                  type="email"
                  placeholder="Email address"
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5DBFC9] focus:border-transparent transition-all"
                />
              </div>
              <div>
                <input
                  type="password"
                  placeholder="Password"
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5DBFC9] focus:border-transparent transition-all"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-[#0B6E78] text-white font-semibold py-3 rounded-lg hover:bg-[#095660] transition-colors"
              >
                {ui.submitText}
              </button>
            </form>

            <p
              id="disclaimer"
              className="text-xs text-gray-500 text-center leading-relaxed"
            >
              By continuing, you agree to our Terms and Privacy Policy.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}