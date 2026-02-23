// app/discover/restaurants/page.tsx
import Image from "next/image";
import Link from "next/link";

const GRADIENT = "bg-gradient-to-br from-teal-600 via-cyan-700 to-blue-800";

export default function RestaurantsPage() {
  return (
    <main className="font-sans antialiased bg-white">
      {/* Header */}
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

          <Link href="/" aria-label="Home" className="text-white hover:text-white/90 transition">
            <IconHome className="h-6 w-6" />
          </Link>
        </div>
      </header>

      {/* White spacer */}
      <div className="bg-white py-8" />

      {/* Content strip */}
      <section className={`${GRADIENT} py-14 px-6`}>
        <div className="max-w-6xl mx-auto">
          <h1 className="text-white text-3xl md:text-4xl font-semibold mb-10">
            Restaurants
          </h1>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <HubCard
              href="/hubs/restaurants/desi-bites"
              title="Desi Bites"
              location="Richmond, VA"
              description="Authentic Indian cuisine & community dining"
            />
          </div>
        </div>
      </section>

      {/* White spacer */}
      <div className="bg-white py-8" />

      {/* Footer */}
      <footer className={`${GRADIENT} py-6 px-6`}>
        <div className="text-center">
          <p className="text-white text-sm">© 2026 uDeets. All rights reserved.</p>
        </div>
      </footer>
    </main>
  );
}

/* ================= Components ================= */

function HubCard({
  href,
  title,
  location,
  description,
}: {
  href: string;
  title: string;
  location: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="bg-white rounded-2xl p-7 shadow-lg hover:shadow-xl transition-shadow"
    >
      <span className="text-xs font-semibold bg-gray-100 text-gray-800 px-3 py-1 rounded-full">
        {location}
      </span>

      <h3 className="text-xl font-bold text-gray-900 mt-4 mb-2">{title}</h3>
      <p className="text-gray-600 text-sm">{description}</p>

      <div className="mt-6 font-semibold text-gray-900">View Hub →</div>
    </Link>
  );
}

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