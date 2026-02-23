// app/page.tsx

import Image from "next/image";
import Link from "next/link";

const GRADIENT = "bg-gradient-to-br from-teal-600 via-cyan-700 to-blue-800";

export default function HomePage() {
  return (
    <main className="font-sans antialiased">
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

          <div className="flex items-center gap-6">
            <Link href="/auth" className="text-white hover:text-white/90 transition">
              Sign In
            </Link>

            <Link
              href="/auth"
              className="bg-white text-gray-900 px-6 py-2 rounded-xl font-medium hover:bg-gray-100 transition"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* ================= WHITE STRIP (HEADER → INTRO) ================= */}
      <div className="bg-white py-8" />

      {/* ================= uDEETS INTRO / HERO ================= */}
      <section className={`${GRADIENT} py-28 px-6`}>
        <div className="max-w-5xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
            uDeets{" "}
          </h1>

          <p className="text-white/90 text-xl max-w-3xl mx-auto mb-10">
            uDeets is a community hub platform for religious groups, associations,
            businesses and local communities. Stay informed, stay connected.
          </p>

          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link
              href="/discover"
              className="bg-white text-gray-900 px-8 py-4 rounded-xl font-semibold text-lg hover:bg-gray-100 transition shadow-lg"
            >
              Discover Hubs
            </Link>

            <Link
              href="/auth"
              className="border-2 border-white text-white px-8 py-4 rounded-xl font-semibold text-lg hover:bg-white/10 transition"
            >
              Get Started
            </Link>
          </div>
        </div>
      </section>

      {/* ================= BUILT FOR EVERY COMMUNITY ================= */}
      <section className="bg-white py-24 px-6">
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-gray-900 mb-12">
            Built for Every Community
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              "Religious Groups",
              "Communities",
              "Restaurants",
              "Associations",
              "HOAs",
              "Schools",
              "Sports Clubs",
              "Non-Profits",
            ].map((item) => (
              <div
                key={item}
                className={`${GRADIENT} rounded-2xl p-6 shadow-sm hover:shadow-md transition`}
              >
                <h3 className="font-semibold text-white">{item}</h3>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= CTA (GRADIENT BLOCK, NOT FULL STRIP) ================= */}
      <section className="bg-white py-20 px-6">
        <div className="max-w-5xl mx-auto text-center">
          <div className={`${GRADIENT} rounded-3xl p-12 sm:p-16 shadow-2xl`}>
            <h2 className="text-4xl font-bold text-white mb-6">
              Ready to build your hub?
            </h2>

            <p className="text-white/90 mb-8 text-lg max-w-2xl mx-auto">
              Create a hub for your community or business and start sharing updates, events,
              and announcements in one place.
            </p>

            <Link
              href="/auth"
              className="inline-block bg-white text-gray-900 px-10 py-4 rounded-xl font-semibold text-lg hover:bg-gray-100 transition shadow-lg"
            >
              Create Your Hub
            </Link>
          </div>
        </div>
      </section>

      {/* ================= WHITE STRIP (CTA → FOOTER) ================= */}
      <div className="bg-white py-8" />

      {/* ================= FOOTER (EDGE-TO-EDGE) ================= */}
      <footer className={`${GRADIENT} py-6 px-6`}>
        <div className="text-center">
          <p className="text-white text-sm">© 2026 uDeets. All rights reserved.</p>
        </div>
      </footer>
    </main>
  );
}