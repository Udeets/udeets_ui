// app/discover/religious-places/page.tsx

import Image from "next/image";
import Link from "next/link";

const GRADIENT = "bg-gradient-to-br from-teal-600 via-cyan-700 to-blue-800";

export default function ReligiousPlacesDiscoverPage() {
  return (
    <main className="font-sans antialiased bg-white">
      {/* ================= HEADER (EDGE-TO-EDGE) ================= */}
      <header className={`${GRADIENT} py-4 px-8`}>
        <div className="flex w-full items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <Image
              src="/udeets-logo.png"
              alt="uDeets Logo"
              width={48}
              height={48}
              priority
              className="h-12 w-12 object-contain"
            />
            <span className="text-white text-2xl font-bold">uDeets</span>
          </Link>

          <Link
            href="/"
            aria-label="Home"
            className="text-white hover:text-white/90 transition"
          >
            <IconHome className="h-6 w-6" />
          </Link>
        </div>
      </header>

      {/* ================= WHITE SPACER ================= */}
      <div className="bg-white py-8" />

      {/* ================= PAGE STRIP (GRADIENT EDGE-TO-EDGE) ================= */}
      <section className={`${GRADIENT} py-14 px-6`}>
        <div className="max-w-6xl mx-auto">
          <div className="mb-10">
            <h1 className="text-white text-3xl md:text-4xl font-semibold">
              Religious Places
            </h1>
            <p className="text-white/90 mt-2 text-sm md:text-base max-w-2xl">
              Explore spiritual communities and sacred spaces near you.
            </p>
          </div>

          {/* Hub list (for now only one hub) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <HubListCard
              href="/hubs/religious-places/hindu-center-of-virginia"
              title="Hindu Center of Virginia"
              description="Religious & Cultural Community Hub"
              metaLeft="Glen Allen, VA"
              metaRight="Public"
              icon={<span className="text-white text-2xl">🕉️</span>}
            />
          </div>

          {/* Optional CTA */}
          <div className="mt-12">
            <div className="bg-white/10 border border-white/20 rounded-2xl p-6 md:p-8">
              <h2 className="text-white text-xl md:text-2xl font-bold mb-2">
                Don&apos;t see your religious place?
              </h2>
              <p className="text-white/90 text-sm md:text-base mb-6">
                Create a hub so members can follow announcements, events, and updates.
              </p>

              <Link
                href="/auth"
                className="inline-flex items-center justify-center bg-white text-gray-900 px-7 py-3 rounded-xl font-semibold hover:bg-gray-100 transition shadow-lg"
              >
                Create a Hub
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ================= WHITE STRIP BEFORE FOOTER ================= */}
      <div className="bg-white py-8" />

      {/* ================= FOOTER ================= */}
      <footer className={`${GRADIENT} py-6 px-6`}>
        <div className="text-center">
          <p className="text-white text-sm">© 2026 uDeets. All rights reserved.</p>
        </div>
      </footer>
    </main>
  );
}

/* ================= COMPONENTS ================= */

function HubListCard({
  href,
  title,
  description,
  metaLeft,
  metaRight,
  icon,
}: {
  href: string;
  title: string;
  description: string;
  metaLeft: string;
  metaRight: string;
  icon: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="bg-white rounded-2xl p-7 shadow-lg hover:shadow-xl transition-shadow border border-white/30"
    >
      <div className="flex items-start justify-between gap-6">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-3">
            <span className="inline-flex items-center gap-2 text-xs font-semibold px-3 py-1 rounded-full bg-gray-100 text-gray-800">
              {metaLeft}
            </span>
            <span className="inline-flex items-center gap-2 text-xs font-semibold px-3 py-1 rounded-full bg-gray-100 text-gray-800">
              {metaRight}
            </span>
          </div>

          <h3 className="text-xl font-bold text-gray-900 mb-2">{title}</h3>
          <p className="text-gray-600 text-sm">{description}</p>

          <div className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-gray-900">
            View Hub <span aria-hidden>→</span>
          </div>
        </div>

        <div className={`${GRADIENT} w-16 h-16 rounded-2xl flex items-center justify-center shrink-0`}>
          {icon}
        </div>
      </div>
    </Link>
  );
}

/* ================= ICON ================= */

function IconHome({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
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