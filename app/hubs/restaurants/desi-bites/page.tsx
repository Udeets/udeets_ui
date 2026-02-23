// app/hubs/restaurants/desi-bites/page.tsx
"use client";

import Image from "next/image";
import Link from "next/link";

const GRADIENT = "bg-gradient-to-br from-teal-600 via-cyan-700 to-blue-800";

// Desi Bites local theme (from your HTML)
const DARK_AQUA = "#006978";
const LIGHT_AQUA = "#4DD0E1";

export default function DesiBitesPage() {
  function scrollGallery(delta: number) {
    const el = document.getElementById("gallery-scroll");
    if (!el) return;
    el.scrollBy({ left: delta, behavior: "smooth" });
  }

  return (
    <main className="min-h-screen bg-gray-50 font-sans text-gray-800 antialiased selection:text-white selection:bg-[color:var(--sel)]">
      {/* selection color helper */}
      <style jsx global>{`
        :root {
          --sel: ${DARK_AQUA};
        }
      `}</style>

      {/* ================= Top Navigation (uDeets global) ================= */}
      <header className={`${GRADIENT} w-full shadow-sm sticky top-0 z-50`}>
        <div className="w-full px-8 h-16 flex items-center justify-between">
          {/* Left: Logo + Brand */}
          <Link href="/" className="flex items-center gap-3">
            <Image
              src="/udeets-logo.png"
              alt="uDeets Logo"
              width={40}
              height={40}
              priority
              className="h-10 w-10 object-contain"
            />
            <span className="text-white font-bold text-2xl tracking-tight">
              uDeets
            </span>
          </Link>

          {/* Right: Home Icon */}
          <Link
            href="/"
            aria-label="Home"
            className="text-white/90 hover:text-white transition p-2 rounded-lg hover:bg-white/10"
          >
            <IconHome className="h-6 w-6" />
          </Link>
        </div>
      </header>

      {/* ================= Hero ================= */}
      <section className="relative w-full h-[400px] overflow-hidden bg-gray-900">
        <div className="absolute inset-0 w-full h-full">
          <img
            src="https://storage.googleapis.com/uxpilot-auth.appspot.com/0d4515c3b5-d9702bf1614acf9746e3.png"
            alt="A vibrant spread of authentic Indian dishes including curries and naan"
            className="w-full h-full object-cover opacity-60"
          />
          <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px]" />
        </div>

        <div className="relative z-10 max-w-6xl mx-auto px-6 h-full flex flex-col items-center justify-center text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-3 tracking-tight drop-shadow-md">
            Desi Bites
          </h1>

          <p className="text-white/80 text-lg md:text-xl font-medium mb-8 tracking-wide">
            Indian Restaurant • Public Hub
          </p>

          <Link
            href="/auth"
            className="text-white font-semibold py-3 px-8 rounded-full shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 inline-flex items-center gap-2"
            style={{ backgroundColor: DARK_AQUA }}
          >
            <span>Subscribe</span>
            <span aria-hidden className="text-sm">→</span>
          </Link>
        </div>
      </section>

      {/* ================= Main Content ================= */}
      <section className="max-w-6xl mx-auto px-6 py-10 md:py-14">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
          {/* Left column */}
          <div className="flex flex-col gap-6">
            {/* About */}
            <article className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 hover:shadow-md transition-shadow duration-300">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center mr-3">
                  <IconStore className="h-5 w-5 text-orange-600" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900">
                  About Desi Bites
                </h2>
              </div>
              <p className="text-gray-600 leading-relaxed text-sm md:text-base">
                Desi Bites is a local Indian restaurant hub for specials, deals,
                and updates. This page is public to view; subscribe to get
                notified about our latest offerings and community events.
              </p>
            </article>

            {/* Featured */}
            <article className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 hover:shadow-md transition-shadow duration-300">
              <div className="flex items-center mb-5">
                <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center mr-3">
                  <IconFlame className="h-5 w-5 text-red-600" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Featured Items
                </h2>
              </div>

              <ul className="space-y-3">
                <FeaturedRow label="Butter Chicken" />
                <FeaturedRow label="Chicken Biryani" />
                <FeaturedRow label="Masala Dosa" />
                <FeaturedRow label="Samosa / Chaat" />
                <FeaturedRow label="Mango Lassi / Chai" />
              </ul>
            </article>

            {/* Deals */}
            <article className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 hover:shadow-md transition-shadow duration-300">
              <div className="flex items-center mb-5">
                <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center mr-3">
                  <IconTag className="h-5 w-5 text-green-600" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Deals &amp; Offers
                </h2>
              </div>

              <div className="space-y-4">
                <DealBlock
                  title="Breakfast Deal"
                  desc="Value breakfast offer available until 11 AM daily."
                />
                <DealBlock
                  title="Lunch Combo"
                  desc="Includes curry, rice, naan, and a drink for one low price."
                />
                <DealBlock
                  title="Weekend Specials"
                  desc="Rotating chef's specials available only on Sat & Sun."
                />
              </div>
            </article>
          </div>

          {/* Right column */}
          <div className="flex flex-col gap-6">
            {/* Visit */}
            <article className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 hover:shadow-md transition-shadow duration-300">
              <div className="flex items-center mb-5">
                <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center mr-3">
                  <IconLocation className="h-5 w-5 text-blue-600" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900">Visit</h2>
              </div>

              <div className="space-y-4">
                <InfoRow
                  icon={<IconMapPin className="h-4 w-4" />}
                  label="Address"
                  value="Short Pump / Richmond area"
                />
                <InfoRow
                  icon={<IconUtensils className="h-4 w-4" />}
                  label="Ordering"
                  value="Dine-in • Takeout"
                />
                <InfoRow
                  icon={<IconBell className="h-4 w-4" />}
                  label="Updates"
                  value="Specials posted regularly"
                />
              </div>
            </article>

            {/* Hours */}
            <article className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 hover:shadow-md transition-shadow duration-300">
              <div className="flex items-center mb-5">
                <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center mr-3">
                  <IconClock className="h-5 w-5 text-purple-600" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900">Hours</h2>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 text-center border border-gray-100">
                <p className="text-lg font-medium text-gray-800 mb-1">
                  Open daily
                </p>
                <p className="text-sm text-gray-500 italic mb-3">(hours vary)</p>
                <div className="w-full h-px bg-gray-200 my-3" />
                <p className="text-gray-700 font-medium">
                  Lunch &amp; Dinner service
                </p>
              </div>
            </article>

            {/* Support Local */}
            <article className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 hover:shadow-md transition-shadow duration-300 flex flex-col h-full">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 rounded-full bg-yellow-50 flex items-center justify-center mr-3">
                  <IconHeart className="h-5 w-5 text-yellow-500" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Support Local
                </h2>
              </div>

              <p className="text-gray-600 mb-6 flex-grow">
                Support Desi Bites by subscribing for updates and sharing
                specials with friends. Your engagement helps us thrive!
              </p>

              <Link
                href="/auth"
                className="w-full text-white font-medium py-2.5 px-4 rounded-lg text-center transition-colors duration-200 shadow-sm inline-flex items-center justify-center gap-2"
                style={{ backgroundColor: DARK_AQUA }}
              >
                <span>Subscribe</span>
                <span className="text-xs">✓</span>
              </Link>
            </article>
          </div>
        </div>
      </section>

      {/* ================= Gallery (LAST SECTION — NO FOOTER) ================= */}
      <section className="w-full bg-white border-t border-gray-200 py-10 pb-12">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <div
                className="w-1 h-6 rounded-full mr-3"
                style={{ backgroundColor: DARK_AQUA }}
              />
              <h2 className="text-2xl font-bold" style={{ color: DARK_AQUA }}>
                Gallery
              </h2>
            </div>

            {/* Desktop arrows */}
            <div className="hidden md:flex gap-2">
              <button
                type="button"
                onClick={() => scrollGallery(-300)}
                className="p-2 rounded-full border border-gray-200 hover:bg-gray-50 transition-colors"
                style={{ color: DARK_AQUA }}
                aria-label="Scroll gallery left"
              >
                <span>‹</span>
              </button>
              <button
                type="button"
                onClick={() => scrollGallery(300)}
                className="p-2 rounded-full border border-gray-200 hover:bg-gray-50 transition-colors"
                style={{ color: DARK_AQUA }}
                aria-label="Scroll gallery right"
              >
                <span>›</span>
              </button>
            </div>
          </div>

          <div
            id="gallery-scroll"
            className="flex overflow-x-auto gap-4 pb-4 snap-x snap-mandatory scroll-smooth hide-scrollbar"
          >
            <GalleryImage
              src="https://images.unsplash.com/photo-1631452180519-c014fe946bc7?q=80&w=1974&auto=format&fit=crop"
              alt="Traditional Chicken Biryani with aromatic rice"
            />
            <GalleryImage
              src="https://storage.googleapis.com/uxpilot-auth.appspot.com/30d89dfaed-736a4220d78204e3b28b.png"
              alt="Crispy Masala Dosa served with chutneys"
            />
            <GalleryImage
              src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=2070&auto=format&fit=crop"
              alt="Cozy modern restaurant interior dining area"
            />
            <GalleryImage
              src="https://images.unsplash.com/photo-1601050690597-df0568f70950?q=80&w=2070&auto=format&fit=crop"
              alt="Golden fried vegetable samosas"
            />
            <GalleryImage
              src="https://images.unsplash.com/photo-1555396273-367ea4eb4db5?q=80&w=1974&auto=format&fit=crop"
              alt="Restaurant storefront and signage"
            />
            <GalleryImage
              src="https://storage.googleapis.com/uxpilot-auth.appspot.com/e136e9b99b-bcdfed9e2ce930bbf515.png"
              alt="Hot steaming cup of Masala Chai"
            />
            <GalleryImage
              src="https://images.unsplash.com/photo-1589302168068-964664d93dc0?q=80&w=1974&auto=format&fit=crop"
              alt="Close up of rich tomato-based Indian curry"
            />
            <GalleryImage
              src="https://images.unsplash.com/photo-1552566626-52f8b828add9?q=80&w=2070&auto=format&fit=crop"
              alt="Elegant dining table setup at the restaurant"
            />
          </div>
        </div>
      </section>

      {/* Hard Stop Rule - NO FOOTER, NO EXTRA CONTENT */}
    </main>
  );
}

/* ================= Components ================= */

function FeaturedRow({ label }: { label: string }) {
  return (
    <li className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 transition-colors group">
      <span className="text-gray-700 font-medium group-hover:text-[#006978] transition-colors">
        {label}
      </span>
      <span className="text-gray-300 text-xs">›</span>
    </li>
  );
}

function DealBlock({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="border-b border-gray-100 pb-3 last:border-0 last:pb-0">
      <h3 className="font-semibold text-gray-800 text-base mb-1">{title}</h3>
      <p className="text-sm text-gray-500">{desc}</p>
    </div>
  );
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start">
      <div className="w-8 pt-1 text-gray-400">{icon}</div>
      <div>
        <span className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-0.5">
          {label}
        </span>
        <span className="text-gray-800 font-medium">{value}</span>
      </div>
    </div>
  );
}

function GalleryImage({ src, alt }: { src: string; alt: string }) {
  return (
    <div className="flex-none w-64 md:w-72 h-48 rounded-xl overflow-hidden shadow-sm border border-gray-100 snap-center">
      <img
        src={src}
        alt={alt}
        className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
      />
    </div>
  );
}

/* ================= Icons (inline SVG) ================= */

function IconHome({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
      <path d="M3 10.5 12 3l9 7.5V21H3V10.5Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M9.5 21v-6h5v6" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
    </svg>
  );
}

function IconStore({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
      <path d="M4 7h16l-1 5H5L4 7Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M6 12v9h12v-9" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M9 21v-6h6v6" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M7 7V5a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v2" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

function IconFlame({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
      <path
        d="M12 22c4 0 7-3 7-7 0-2.7-1.6-4.8-3.5-6.5C14.5 7.6 14 6 14 4c-2 1-4 3-4 6-1-1-2.5-2.5-3-5C4.5 7 5 9 5 11c0 6 3 11 7 11Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconTag({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
      <path d="M3 12V3h9l9 9-9 9-9-9Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M7.5 7.5h0" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

function IconLocation({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
      <path
        d="M12 22s7-4.5 7-11a7 7 0 1 0-14 0c0 6.5 7 11 7 11Z"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        d="M12 11.5a2.5 2.5 0 1 0-2.5-2.5 2.5 2.5 0 0 0 2.5 2.5Z"
        stroke="currentColor"
        strokeWidth="2"
      />
    </svg>
  );
}

function IconClock({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
      <path d="M12 22a10 10 0 1 0-10-10 10 10 0 0 0 10 10Z" stroke="currentColor" strokeWidth="2" />
      <path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function IconHeart({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
      <path
        d="M12 21s-7-4.5-9-9c-1.5-3.5 1-7 5-7 2 0 3.5 1 4 2 0.5-1 2-2 4-2 4 0 6.5 3.5 5 7-2 4.5-9 9-9 9Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconMapPin({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
      <path
        d="M12 22s7-4.5 7-11a7 7 0 1 0-14 0c0 6.5 7 11 7 11Z"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path d="M12 11.5a2.5 2.5 0 1 0-2.5-2.5" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

function IconUtensils({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
      <path d="M6 2v8M4 2v8M8 2v8M6 10v12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M14 2v8c0 2 2 2 2 0V2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M16 10v12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M20 4v18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function IconBell({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
      <path
        d="M18 8a6 6 0 1 0-12 0c0 7-3 7-3 7h18s-3 0-3-7Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M13.73 21a2 2 0 0 1-3.46 0"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}