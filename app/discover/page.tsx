// app/discover/page.tsx

import Image from "next/image";
import Link from "next/link";

const GRADIENT = "bg-gradient-to-br from-teal-600 via-cyan-700 to-blue-800";

export default function DiscoverPage() {
  return (
    <div className="font-sans antialiased">
      {/* ================= HEADER (EDGE-TO-EDGE) ================= */}
      <header className={`${GRADIENT} py-4 px-8`}>
        <div className="flex w-full items-center justify-between">
          {/* Logo + Brand */}
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

          {/* Home Icon */}
          <Link
            href="/"
            aria-label="Home"
            className="text-white hover:text-white/90 transition"
          >
            <IconHome className="h-6 w-6" />
          </Link>
        </div>
      </header>

      {/* ================= WHITE SPACER (EDGE-TO-EDGE) ================= */}
      <div className="bg-white py-8" />

      {/* ================= DISCOVER STRIP (EDGE-TO-EDGE BG) ================= */}
      <section className={`${GRADIENT} py-16 px-6`}>
        <div className="max-w-7xl mx-auto">
          <h2 className="text-white text-3xl md:text-4xl font-semibold mb-10">
            Discover Hubs
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
            <HubCard
              href="/discover/religious-places"
              title="Religious Places"
              description="Connect with spiritual communities and sacred spaces"
              icon={<IconPlaceOfWorship className="h-7 w-7 text-white" />}
            />

            <HubCard
              href="/discover/communities"
              title="Communities"
              description="Join groups of people with shared interests and values"
              icon={<IconUsers className="h-7 w-7 text-white" />}
            />

            <HubCard
              href="/discover/restaurants"
              title="Restaurants"
              description="Explore culinary experiences and dining communities"
              icon={<IconUtensils className="h-7 w-7 text-white" />}
            />
          </div>
        </div>
      </section>

      {/* ================= CREATE HUB CTA ================= */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-3xl mx-auto text-center">
          <div className={`${GRADIENT} rounded-3xl p-12 shadow-2xl`}>
            <h2 className="text-white text-3xl md:text-4xl font-bold mb-4">
              Create Hub
            </h2>
            <p className="text-white text-lg mb-8 opacity-95">
              Start your own community and bring like-minded people together
            </p>

            <Link
              href="/auth"
              className="inline-flex items-center justify-center bg-white text-gray-900 px-8 py-4 rounded-xl font-semibold text-lg hover:bg-gray-100 transition-colors shadow-lg"
            >
              Create New Hub
            </Link>
          </div>
        </div>
      </section>

      {/* ================= FOOTER (EDGE-TO-EDGE) ================= */}
      <footer className={`${GRADIENT} py-6 px-6`}>
        <div className="text-center">
          <p className="text-white text-sm">© 2026 uDeets. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

/* ================= HUB CARD COMPONENT ================= */

function HubCard({
  href,
  title,
  description,
  icon,
}: {
  href: string;
  title: string;
  description: string;
  icon: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow block"
    >
      <div className="flex items-center justify-center w-16 h-16 rounded-xl bg-gradient-to-br from-teal-600 via-cyan-700 to-blue-800 mb-6">
        {icon}
      </div>

      <h3 className="text-gray-900 text-xl font-semibold mb-3">{title}</h3>
      <p className="text-gray-600 text-sm">{description}</p>
    </Link>
  );
}

/* ================= ICONS ================= */

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

function IconUsers({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
      <path
        d="M16 11a4 4 0 1 0-8 0 4 4 0 0 0 8 0Z"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        d="M4 21a8 8 0 0 1 16 0"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconUtensils({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
      <path
        d="M6 2v8M4 2v8M8 2v8M6 10v12"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M14 2v8c0 2 2 2 2 0V2"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path d="M16 10v12" stroke="currentColor" strokeWidth="2" />
      <path d="M20 4v18" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

function IconPlaceOfWorship({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
      <path
        d="M12 3 3 8l9 5 9-5-9-5Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M5 10v9h14v-9"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        d="M9 19v-5h6v5"
        stroke="currentColor"
        strokeWidth="2"
      />
    </svg>
  );
}