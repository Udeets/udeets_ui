"use client";

import { useState } from "react";
import { useLanguage } from "../context/LanguageContext";
import { translations } from "../translations";
import { UDeetsLogo } from "@udeets/ui";

export default function AuthPage() {
  const { lang } = useLanguage();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const t = translations[lang];

  return (
    <>
      {/* Header */}
      <header className="absolute top-0 left-0 w-full">
        <div className="flex items-center justify-between px-10 py-6">
          <UDeetsLogo className="w-36" />
        </div>
      </header>

      {/* Main */}
      <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-teal-100 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md pt-6">
          {/* Title */}
          <h1 className="text-3xl font-bold text-gray-900 text-center mb-2">
            {t.createBusinessAccount}
          </h1>

          <p className="text-center text-gray-500 mb-8">
            {t.joinUdeets}
          </p>

          {/* Social auth: buttons with logos and text in grey oval section */}
          <div className="bg-gray-100 rounded-xl p-4 space-y-3">
            {/* Google Button */}
            <button
              aria-label="Continue with Google"
              className="w-full rounded-lg border border-red-200 bg-white/70 hover:bg-red-50 transition flex items-center justify-center gap-4 px-6 py-3 text-gray-800 shadow-sm hover:shadow"
            >
              <svg width="20" height="20" viewBox="0 0 48 48">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.36 1.53 8.28 2.82l6.1-6.1C34.54 2.56 29.7 0 24 0 14.64 0 6.6 5.38 2.68 13.22l7.1 5.5C11.62 13.5 17.32 9.5 24 9.5z"/>
                <path fill="#4285F4" d="M46.1 24.5c0-1.64-.15-2.85-.47-4.1H24v7.77h12.7c-.26 2.08-1.68 5.22-4.82 7.33l7.4 5.73C43.6 37.3 46.1 31.7 46.1 24.5z"/>
                <path fill="#FBBC05" d="M9.78 28.72A14.5 14.5 0 0 1 9 24c0-1.64.28-3.22.76-4.72l-7.1-5.5A23.94 23.94 0 0 0 0 24c0 3.87.93 7.53 2.66 10.78l7.12-5.5z"/>
                <path fill="#34A853" d="M24 48c6.48 0 11.92-2.13 15.9-5.77l-7.4-5.73c-2 1.4-4.68 2.35-8.5 2.35-6.68 0-12.38-4-14.22-9.22l-7.12 5.5C6.6 42.62 14.64 48 24 48z"/>
              </svg>
              <span className="text-sm font-medium text-gray-700">{t.continueWithGoogle}</span>
            </button>

            {/* Facebook Button */}
            <button
              aria-label="Continue with Facebook"
              className="w-full rounded-lg border border-blue-200 bg-white/70 hover:bg-blue-50 transition flex items-center justify-center gap-4 px-6 py-3 text-gray-800 shadow-sm hover:shadow"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="#1877F2">
                <path d="M22.675 0h-21.35C.6 0 0 .6 0 1.326v21.348C0 23.4.6 24 1.326 24h11.495v-9.294H9.692v-3.622h3.13V8.413c0-3.1 1.894-4.788 4.66-4.788 1.325 0 2.464.1 2.796.143v3.24h-1.918c-1.504 0-1.796.716-1.796 1.764v2.313h3.59l-.467 3.622h-3.123V24h6.116C23.4 24 24 23.4 24 22.674V1.326C24 .6 23.4 0 22.675 0z"/>
              </svg>
              <span className="text-sm font-medium text-gray-700">{t.continueWithFacebook}</span>
            </button>

            {/* Apple Button */}
            <button
              aria-label="Continue with Apple"
              className="w-full rounded-lg border border-gray-300 bg-white/70 hover:bg-gray-100 transition flex items-center justify-center gap-4 px-6 py-3 text-gray-800 shadow-sm hover:shadow"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="#000000">
                <path d="M16.365 1.43c0 1.14-.418 2.28-1.22 3.19-.86.99-2.28 1.76-3.62 1.64-.17-1.15.34-2.36 1.12-3.22.86-.96 2.33-1.66 3.72-1.59zm3.13 17.36c-.36.83-.54 1.21-1.01 1.97-.66 1.03-1.59 2.32-2.75 2.33-1.03.01-1.3-.67-2.7-.67-1.4 0-1.71.66-2.7.68-1.15.01-2.03-1.15-2.69-2.18-1.83-2.86-2.02-6.22-.9-7.96.8-1.27 2.06-2.02 3.21-2.02 1.22 0 2 .68 3 .68.98 0 1.58-.69 2.99-.69 1.03 0 2.13.56 2.93 1.53-2.58 1.42-2.17 5.12.62 6.33z"/>
              </svg>
              <span className="text-sm font-medium text-gray-700">{t.continueWithApple}</span>
            </button>
          </div>


          {/* Divider */}
          <div className="flex items-center gap-4 mb-6">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-sm text-gray-400">{t.or}</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          {/* Email signup */}
          <div className="space-y-8">
            <div
              className="
                rounded-[20px]
                border border-gray-500
                bg-teal-50
                focus-within:ring-2
                focus-within:ring-teal-500
              "
            >
              <input
                type="email"
                placeholder={t.emailAddress}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="
                  w-full
                  bg-transparent
                  px-5 py-3
                  text-black
                  placeholder-black
                  focus:outline-none
                "
              />
            </div>

            <div
              className="
                rounded-[20px]
                border border-gray-500
                bg-teal-50
                focus-within:ring-2
                focus-within:ring-teal-500
              "
            >
              <input
                type="password"
                placeholder={t.createPassword}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="
                  w-full
                  bg-transparent
                  px-5 py-3
                  text-black
                  placeholder-black
                  focus:outline-none
                "
              />
            </div>

            {/* Legal */}
            <div className="bg-gray-100 rounded-xl p-4">
              <p className="text-xs text-gray-700 leading-relaxed text-center">
                {t.bySigningUp}{" "}
                <a href="/privacy" className="underline text-teal-600 hover:text-teal-700">
                  {t.privacy}
                </a>
                {" "}{t.and}{" "}
                <a href="/member-policy" className="underline text-teal-600 hover:text-teal-700">
                  {t.member}
                </a>
                {" "}{t.policy}
              </p>
            </div>

            <button
              className="
                w-full rounded-full bg-teal-700 py-3
                text-white font-medium
                shadow-md hover:shadow-lg hover:bg-teal-600
                transition-all duration-200 ease-out
                focus:outline-none focus:ring-2 focus:ring-teal-700
                mt-6
              "
            >
              {t.continue}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
