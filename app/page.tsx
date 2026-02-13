"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "./context/LanguageContext";
import { translations } from "./translations";
import { UDeetsLogo } from "@udeets/ui";

export default function Home() {
  const router = useRouter();
  const { lang, setLang } = useLanguage();
  const [langOpen, setLangOpen] = useState(false);
  const t = translations[lang] ?? translations.ENG;
  const descriptionLines = t.udeetsDescription.split("<br />");

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-emerald-50 flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-6 sm:px-10">
        <UDeetsLogo className="w-32 sm:w-36" color="#0f8b6b" />

        <div className="flex items-center gap-3">
          {/* Language dropdown */}
          <div className="relative">
            <button
              onClick={() => setLangOpen(!langOpen)}
              className="rounded-full border border-gray-200 bg-white/70 p-2 hover:bg-white transition shadow-sm"
              title="Change language"
            >
              <svg
                className="w-5 h-5 text-gray-700"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <circle cx="12" cy="12" r="10" />
                <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
              </svg>
            </button>

            {langOpen && (
              <div className="absolute right-0 mt-2 w-24 bg-white border border-gray-200 rounded-md shadow-lg z-50">
                <button
                  onClick={() => {
                    setLang("ENG");
                    setLangOpen(false);
                  }}
                  className="block w-full text-left px-4 py-2 hover:bg-gray-100 text-sm font-medium"
                >
                  ENG
                </button>
                <button
                  onClick={() => {
                    setLang("ESP");
                    setLangOpen(false);
                  }}
                  className="block w-full text-left px-4 py-2 hover:bg-gray-100 text-sm font-medium border-t border-gray-200"
                >
                  ESP
                </button>
              </div>
            )}
          </div>

          <button
            onClick={() => router.push("/auth")}
            className="rounded-full bg-emerald-600 px-6 py-2 text-white font-medium hover:bg-emerald-700 shadow-sm"
          >
            {t.signIn}
          </button>
        </div>
      </header>

      {/* Hero */}
      <main className="flex flex-col items-center text-center px-6 pt-16 sm:pt-20">
        <div className="max-w-4xl">
          <h1 className="mb-3 text-5xl font-bold tracking-tight text-emerald-800 sm:text-6xl md:text-7xl lg:text-8xl">
            uDeets
          </h1>

          <h2 className="mb-4 text-xl font-semibold text-gray-900 sm:text-2xl md:text-3xl">
            {t.udeetsSubtitle}
          </h2>

          <p className="mx-auto mb-8 max-w-3xl text-base leading-relaxed text-gray-600 sm:text-lg">
            {descriptionLines.map((line, i) => (
              <span key={i}>
                {line}
                {i < descriptionLines.length - 1 && <br />}
              </span>
            ))}
          </p>

          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <button
              onClick={() => router.push("/auth")}
              className="rounded-full bg-emerald-600 px-10 py-4 text-base font-semibold text-white shadow-md hover:bg-emerald-700"
            >
              {t.discoverHub}
            </button>

            <button
              onClick={() => router.push("/auth")}
              className="rounded-full border border-emerald-600 px-10 py-4 text-base font-semibold text-emerald-700 hover:bg-emerald-50"
            >
              {t.createHub}
            </button>
          </div>
        </div>

      </main>
    </div>
  );
}
