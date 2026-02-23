// app/hubs/communities/richmond-kannada-sangha/page.tsx
"use client";

import Image from "next/image";
import Link from "next/link";

const GRADIENT = "bg-gradient-to-br from-teal-600 via-cyan-700 to-blue-800";

export default function RichmondKannadaSanghaPage() {
  function scrollGallery(delta: number) {
    const el = document.getElementById("gallery-scroll");
    if (!el) return;
    el.scrollBy({ left: delta, behavior: "smooth" });
  }

  return (
    <main className="min-h-screen flex flex-col bg-white text-gray-800 font-sans antialiased">
      {/* ================= Top Navigation ================= */}
      <header className={`${GRADIENT} w-full sticky top-0 z-50 shadow-md`}>
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
            <span className="text-white font-bold text-2xl tracking-tight">uDeets</span>
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
      <section className="relative w-full h-[400px] bg-gray-900 overflow-hidden">
        <div className="absolute inset-0 w-full h-full">
          {/* Using plain img for remote URL to avoid Next config needs */}
          <img
            src="https://storage.googleapis.com/uxpilot-auth.appspot.com/5e9d4e44a4-e086e2eb704baef0b007.png"
            alt="Kannada Community Cultural Event"
            className="w-full h-full object-cover opacity-60"
          />
        </div>

        <div className="absolute inset-0 bg-black/40" />

        <div className="relative z-10 h-full flex flex-col items-center justify-center text-center px-6 max-w-4xl mx-auto">
          <h1 className="text-white text-3xl sm:text-4xl md:text-5xl font-bold mb-4 tracking-tight leading-tight drop-shadow-lg">
            RKS – Richmond Kannada Sangha
          </h1>

          <p className="text-gray-200 text-lg sm:text-xl mb-8 font-light max-w-2xl mx-auto drop-shadow-md">
            Kannada Community & Cultural Organization • Public
          </p>

          <Link
            href="/auth"
            className="inline-flex items-center justify-center px-8 py-3 rounded-md text-white font-semibold shadow-lg transform hover:-translate-y-0.5 transition-all"
            style={{ backgroundColor: "#006D77" }}
          >
            Subscribe
          </Link>
        </div>
      </section>

      {/* ================= Main Content ================= */}
      <main className="flex-grow w-full max-w-7xl mx-auto px-6 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Left column */}
          <div className="lg:col-span-2 space-y-6">
            {/* About */}
            <section className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 rounded-full bg-[#006D77]/10 flex items-center justify-center mr-3">
                  <IconUsers className="h-5 w-5 text-[#006D77]" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900">About RKS</h2>
              </div>
              <p className="text-gray-600 leading-relaxed">
                Richmond Kannada Sangha (RKS) is a non-profit community organization formed by Kannada-speaking
                families in the greater Richmond area. RKS promotes Kannada language, culture, and community
                connection through educational and cultural activities.
              </p>
            </section>

            {/* Events */}
            <section className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                  <div className="w-10 h-10 rounded-full bg-[#006D77]/10 flex items-center justify-center mr-3">
                    <IconCalendar className="h-5 w-5 text-[#006D77]" />
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900">Upcoming Celebrations</h2>
                </div>

                <span className="bg-[#006D77]/10 text-[#006D77] text-xs font-medium px-2.5 py-0.5 rounded-full">
                  2026 Schedule
                </span>
              </div>

              <div className="space-y-0 divide-y divide-gray-100">
                <EventRow month="Feb" day="28" title="Sangeetha Sanje" time="4:00 PM EST" />
                <EventRow month="Mar" day="14" title="Women&apos;s Day Celebration" time="11:00 AM EST" />
                <EventRow month="Apr" day="18" title="Ugadi Sambhrama" time="4:00 PM EST" />
                <EventRow month="Jun" day="06" title="Picnic" time="9:00 AM – 5:00 PM EST" />
                <EventRow month="Nov" day="14" title="Karnataka Rajyotsava & Deepavali" time="4:00 PM EST" />
              </div>
            </section>

            {/* Posts */}
            <section className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center">
                  <div className="w-10 h-10 rounded-full bg-[#006D77]/10 flex items-center justify-center mr-3">
                    <IconChat className="h-5 w-5 text-[#006D77]" />
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900">Community Posts</h2>
                </div>
                <Link href="/auth" className="text-sm text-[#006D77] hover:underline font-medium">
                  View all
                </Link>
              </div>

              <div className="space-y-4">
                <PostRow initials="JD" colorClass="bg-blue-100 text-blue-600" title="Carpool request for the next meetup" meta="Short Pump area • 2h ago" />
                <PostRow initials="AS" colorClass="bg-green-100 text-green-600" title="Seeking volunteers for cultural program setup" meta="Events • 5h ago" />
                <PostRow initials="RK" colorClass="bg-purple-100 text-purple-600" title="Looking for Kannada kids activities suggestions" meta="General • 1d ago" />
              </div>
            </section>
          </div>

          {/* Right column */}
          <aside className="lg:col-span-1 space-y-6">
            {/* Join */}
            <section className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">Join RKS Family</h2>
              <p className="text-sm text-gray-600 mb-6 leading-relaxed">
                Become part of the Kannada community in Richmond. Subscribe to stay updated about celebrations,
                cultural programs, and announcements.
              </p>
              <Link
                href="/auth"
                className="flex w-full justify-center items-center px-4 py-2.5 rounded-md text-white text-sm font-medium shadow-sm"
                style={{ backgroundColor: "#006D77" }}
              >
                Subscribe
              </Link>
            </section>

            {/* Sponsor */}
            <section className="bg-gray-50 border border-gray-200 rounded-xl p-6 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 -mt-2 -mr-2 w-16 h-16 bg-[#83C5BE]/20 rounded-full blur-xl" />
              <h2 className="text-lg font-semibold text-gray-900 mb-3 relative z-10">Become a Sponsor Today</h2>
              <p className="text-sm text-gray-600 mb-6 leading-relaxed relative z-10">
                Sponsorship helps support cultural programs, venue costs, and community activities.
              </p>
              <Link
                href="/auth"
                className="flex w-full justify-center items-center px-4 py-2.5 rounded-md text-white text-sm font-medium shadow-sm relative z-10"
                style={{ backgroundColor: "#006D77" }}
              >
                Sponsor
              </Link>
            </section>

            {/* Contact */}
            <section className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Contact</h2>

              <div className="space-y-4">
                <div className="flex items-start">
                  <div className="mt-1 text-gray-400">
                    <IconPhone className="h-4 w-4" />
                  </div>
                  <div className="ml-3">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Phone</p>
                    <p className="text-sm font-medium text-gray-900 mt-0.5">(917) 821-4187</p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="mt-1 text-gray-400">
                    <IconMail className="h-4 w-4" />
                  </div>
                  <div className="ml-3">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Email</p>
                    <p className="text-sm font-medium text-gray-900 mt-0.5 break-all">
                      rks.richmondkannadasangha@gmail.com
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Kannada Kali */}
            <section className="bg-gradient-to-br from-white to-[#F0FDFD] border border-gray-200 rounded-xl p-6 shadow-sm">
              <div className="flex items-center mb-3">
                <div className="w-8 h-8 rounded bg-yellow-100 text-yellow-600 flex items-center justify-center mr-3 text-xs font-bold border border-yellow-200">
                  ಅಆ
                </div>
                <h2 className="text-lg font-semibold text-gray-900">Kannada Kali</h2>
              </div>
              <p className="text-sm text-gray-600 mb-4 leading-relaxed">
                Language learning and cultural connection for kids and families. Join to participate and receive
                program updates.
              </p>
              <button
                type="button"
                className="text-sm font-medium text-[#006D77] hover:text-[#005F68] flex items-center transition-colors"
              >
                Learn More <span className="ml-1.5 text-xs">→</span>
              </button>
            </section>
          </aside>
        </div>
      </main>

      {/* ================= Gallery ================= */}
      <section className="w-full bg-gray-50 border-t border-gray-200 py-10 mt-auto">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold" style={{ color: "#006D77" }}>
              Gallery
            </h2>

            <div className="flex space-x-2">
              <button
                type="button"
                className="w-8 h-8 rounded-full border border-gray-300 bg-white flex items-center justify-center text-gray-500 hover:text-[#006D77] hover:border-[#006D77] transition-colors"
                onClick={() => scrollGallery(-300)}
                aria-label="Scroll left"
              >
                <span className="text-xs">‹</span>
              </button>

              <button
                type="button"
                className="w-8 h-8 rounded-full border border-gray-300 bg-white flex items-center justify-center text-gray-500 hover:text-[#006D77] hover:border-[#006D77] transition-colors"
                onClick={() => scrollGallery(300)}
                aria-label="Scroll right"
              >
                <span className="text-xs">›</span>
              </button>
            </div>
          </div>

          <div
            id="gallery-scroll"
            className="flex overflow-x-auto gap-4 pb-4 snap-x snap-mandatory scroll-smooth"
            style={{
              scrollbarWidth: "none",
              msOverflowStyle: "none",
            }}
          >
            <GalleryImage
              src="https://storage.googleapis.com/uxpilot-auth.appspot.com/78a391a8c2-437ab130c9ef54c354e6.png"
              alt="Ugadi celebrations"
            />
            <GalleryImage
              src="https://images.unsplash.com/photo-1512341689857-198e7e2f3ca8?auto=format&fit=crop&w=600&q=80"
              alt="Deepavali celebrations"
            />
            <GalleryImage
              src="https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=600&q=80"
              alt="Picnic gathering"
            />
            <GalleryImage
              src="https://storage.googleapis.com/uxpilot-auth.appspot.com/d655d423c3-5d3a091868bcbbc68d9e.png"
              alt="Music night"
            />
            <GalleryImage
              src="https://images.unsplash.com/photo-1559027615-cd4628902d4a?auto=format&fit=crop&w=600&q=80"
              alt="Volunteer moments"
            />
            <GalleryImage
              src="https://storage.googleapis.com/uxpilot-auth.appspot.com/d78340edc7-6f0e4b10b98051b1b09f.png"
              alt="Cultural program"
            />
            <GalleryImage
              src="https://images.unsplash.com/photo-1511632765486-a01980e01a18?auto=format&fit=crop&w=600&q=80"
              alt="Community gathering"
            />
          </div>
        </div>
      </section>

      {/* ================= Footer ================= */}
      <footer className={`${GRADIENT} py-6 px-6`}>
        <div className="text-center">
          <p className="text-white text-sm">© 2026 Richmond Kannada Sangha. All rights reserved.</p>
          <p className="text-white/80 text-xs mt-1">Non-profit Community Organization</p>

          <div className="mt-4 flex justify-center gap-6 text-white/80">
            <a href="#" className="hover:text-white transition" aria-label="Facebook">
              <span className="text-xl">f</span>
            </a>
            <a href="#" className="hover:text-white transition" aria-label="Instagram">
              <span className="text-xl">⌁</span>
            </a>
            <a href="#" className="hover:text-white transition" aria-label="Twitter">
              <span className="text-xl">𝕏</span>
            </a>
          </div>
        </div>
      </footer>
    </main>
  );
}

/* ================== Small Components ================== */

function EventRow({
  month,
  day,
  title,
  time,
}: {
  month: string;
  day: string;
  title: string;
  time: string;
}) {
  return (
    <div className="py-3 flex flex-col sm:flex-row sm:items-center justify-between group hover:bg-gray-50 rounded-lg px-2 transition-colors -mx-2">
      <div className="flex items-start sm:items-center space-x-3">
        <div className="flex-shrink-0 w-12 text-center bg-gray-50 rounded p-1 border border-gray-100">
          <span className="block text-xs font-bold text-gray-500 uppercase">{month}</span>
          <span className="block text-lg font-bold text-gray-800">{day}</span>
        </div>
        <div>
          <h3 className="text-base font-medium text-gray-900 group-hover:text-[#006D77] transition-colors">
            {title}
          </h3>
          <p className="text-sm text-gray-500 sm:hidden">{time}</p>
        </div>
      </div>
      <div className="mt-2 sm:mt-0 text-sm text-gray-500 font-medium pl-[60px] sm:pl-0">
        {time}
      </div>
    </div>
  );
}

function PostRow({
  initials,
  colorClass,
  title,
  meta,
}: {
  initials: string;
  colorClass: string;
  title: string;
  meta: string;
}) {
  return (
    <Link
      href="/auth"
      className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer group"
    >
      <div className="flex-shrink-0">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${colorClass}`}>
          {initials}
        </div>
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">{title}</p>
        <p className="text-xs text-gray-500 mt-1">
          {meta} • <span className="text-[#006D77]">Login to view</span>
        </p>
      </div>

      <div className="flex-shrink-0 text-gray-400 group-hover:text-[#006D77]">
        <IconLock className="h-4 w-4" />
      </div>
    </Link>
  );
}

function GalleryImage({ src, alt }: { src: string; alt: string }) {
  return (
    <div className="flex-none w-64 h-48 sm:w-72 sm:h-52 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow snap-center border border-gray-200 bg-white">
      <img
        src={src}
        alt={alt}
        className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-500"
      />
    </div>
  );
}

/* ================== Icons (inline SVG) ================== */

function IconHome({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
      <path d="M3 10.5 12 3l9 7.5V21H3V10.5Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M9.5 21v-6h5v6" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
    </svg>
  );
}

function IconUsers({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
      <path d="M16 11a4 4 0 1 0-8 0 4 4 0 0 0 8 0Z" stroke="currentColor" strokeWidth="2" />
      <path d="M4 21a8 8 0 0 1 16 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function IconCalendar({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
      <path d="M7 3v2M17 3v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M4 7h16" stroke="currentColor" strokeWidth="2" />
      <path d="M6 5h12a2 2 0 0 1 2 2v13a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

function IconChat({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
      <path
        d="M21 12a8 8 0 0 1-8 8H7l-4 3V12a8 8 0 0 1 8-8h2a8 8 0 0 1 8 8Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path d="M8 12h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M8 16h5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function IconLock({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
      <path d="M7 11V8a5 5 0 0 1 10 0v3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M6 11h12v10H6V11Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
    </svg>
  );
}

function IconPhone({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
      <path
        d="M6 3h4l2 5-3 2c1 3 4 6 7 7l2-3 5 2v4c0 1-1 2-2 2C10 22 2 14 2 4c0-1 1-1 2-1h2Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconMail({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
      <path d="M4 6h16v12H4V6Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="m4 7 8 6 8-6" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
    </svg>
  );
}