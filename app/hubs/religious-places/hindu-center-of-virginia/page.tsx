"use client";

// app/hubs/hindu-center-of-virginia/page.tsx
import Image from "next/image";
import Link from "next/link";
import { useRef } from "react";

const GRADIENT = "bg-gradient-to-br from-teal-600 via-cyan-700 to-blue-800";

export default function HinduCenterOfVirginiaPage() {
  const galleryRef = useRef<HTMLDivElement | null>(null);

  function scrollGallery(dir: "left" | "right") {
    const el = galleryRef.current;
    if (!el) return;
    const amount = dir === "left" ? -340 : 340;
    el.scrollBy({ left: amount, behavior: "smooth" });
  }

  return (
    <main className="font-sans antialiased bg-gray-50 text-gray-800">
      {/* ================= TOP SKIRT (uDeets standard) ================= */}
      <header className={`${GRADIENT} py-4 px-8 sticky top-0 z-50 shadow-md`}>
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

      {/* ================= HERO ================= */}
      <section className="relative w-full h-[500px] md:h-[600px] overflow-hidden bg-gray-900">
        {/* Background image */}
        <div className="absolute inset-0">
          <Image
            src="https://images.unsplash.com/photo-1561361513-2d000a50f0dc?q=80&w=2076&auto=format&fit=crop"
            alt="Hindu Center of Virginia Temple Exterior"
            fill
            unoptimized
            className="object-cover opacity-90"
            priority
          />
          {/* overlay */}
          <div className="absolute inset-0 bg-black/50 bg-gradient-to-b from-black/60 via-transparent to-black/70" />
        </div>

        {/* Content */}
        <div className="relative z-10 h-full flex flex-col justify-center items-center text-center px-4">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 drop-shadow-lg tracking-tight">
            Hindu Center of Virginia
          </h1>

          <div className="flex flex-wrap items-center justify-center gap-2 text-gray-200 text-base md:text-lg font-medium mb-8 bg-black/20 px-4 py-2 rounded-full backdrop-blur-sm border border-white/10">
            <span className="text-white/90">🕉️</span>
            <span>Religious &amp; Cultural Community Hub</span>
            <span className="text-cyan-200">•</span>
            <span>Public</span>
          </div>

          <Link
            href="/auth"
            className={`${GRADIENT} hover:opacity-95 text-white px-8 py-3 rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 active:scale-95 inline-flex items-center gap-2`}
          >
            <span aria-hidden>🔔</span>
            Subscribe
          </Link>
        </div>
      </section>

      {/* ================= MAIN CONTENT ================= */}
      <section className="max-w-6xl mx-auto px-4 py-8 md:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* LEFT COLUMN (2/3) */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            {/* About */}
            <Card
              title="About the Center"
              icon="ℹ️"
              titleClass="text-gray-900"
            >
              <p className="text-gray-600 leading-relaxed text-lg">
                Hindu Center of Virginia (HCV) offers religious services,
                cultural activities, classes, and community events. It&apos;s
                located at 6051 Springfield Road, Glen Allen, VA.
              </p>

              <div className="mt-6 flex flex-wrap gap-2">
                <Pill>Non-profit</Pill>
                <Pill>Community</Pill>
                <Pill>Religious</Pill>
              </div>
            </Card>

            {/* Temple Timings */}
            <Card title="Temple Timings" icon="🕒" titleClass="text-gray-900">
              <div className="space-y-4">
                <TimingRow
                  label="Monday – Friday"
                  time="7:00am – 11:00am & 5:00pm – 8:30pm"
                  icon="📅"
                />
                <TimingRow
                  label="Saturday – Sunday"
                  time="9:00am – 8:30pm"
                  icon="☀️"
                />
              </div>

              <div className="mt-4 flex items-center gap-2 text-sm text-green-600 font-medium px-1">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500" />
                </span>
                Temple is currently Open
              </div>
            </Card>

            {/* Upcoming Events */}
            <Card
              title="Upcoming Events"
              icon="📆"
              rightLink={<Link href="#" className="text-sm text-gray-700 hover:underline font-medium">View All</Link>}
              titleClass="text-gray-900"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <EventCard
                  badge="Annual"
                  badgeClass="bg-orange-100 text-orange-600"
                  title="Festival of India"
                  desc="A grand celebration of culture, food, and music."
                  metaLeft="Oct 24"
                  metaRight="Main Hall"
                />
                <EventCard
                  badge="Weekly"
                  badgeClass="bg-purple-100 text-purple-600"
                  title="Temple Traditions"
                  desc="Weekly gathering to discuss vedic traditions."
                  metaLeft="Every Sun"
                  metaRight="Library"
                />
              </div>
            </Card>
          </div>

          {/* RIGHT COLUMN (1/3) */}
          <div className="flex flex-col gap-6">
            {/* Visit & Contact */}
            <Card title="Visit & Contact" icon="📍" titleClass="text-gray-900">
              <div className="space-y-5">
                <InfoRow
                  icon="📍"
                  label="Address"
                  lines={["6051 Springfield Rd,", "Glen Allen, VA 23060"]}
                  extra={
                    <a
                      className="inline-block mt-2 text-xs text-gray-800 font-semibold hover:underline"
                      href="https://www.google.com/maps/search/?api=1&query=6051+Springfield+Rd,+Glen+Allen,+VA+23060"
                      target="_blank"
                      rel="noreferrer"
                    >
                      Get Directions
                    </a>
                  }
                />
                <InfoRow icon="📞" label="Phone" lines={["(804) 346-9954"]} />
                <InfoRow
                  icon="✉️"
                  label="Email"
                  lines={["info@hinducenterofvirginia.org"]}
                />
              </div>

              {/* Mini map */}
              <div className="h-32 bg-gray-100 relative mt-6 rounded-lg overflow-hidden">
                <Image
                  src="https://images.unsplash.com/photo-1542704792-e30dac463c90?q=80&w=2070&auto=format&fit=crop"
                  alt="Glen Allen Virginia Map Area"
                  fill
                  unoptimized
                  className="object-cover opacity-60"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <a
                    href="https://www.google.com/maps/search/?api=1&query=6051+Springfield+Rd,+Glen+Allen,+VA+23060"
                    target="_blank"
                    rel="noreferrer"
                    className="bg-white text-gray-800 px-4 py-2 rounded shadow-sm text-sm font-medium hover:bg-gray-50 border border-gray-200 transition-colors"
                  >
                    View on Map
                  </a>
                </div>
              </div>
            </Card>

            {/* Activities */}
            <Card title="Activities" icon="🙏" titleClass="text-gray-900">
              <ul className="divide-y divide-gray-50 -mx-6">
                <ActivityRow dotClass="bg-orange-400" text="Religious services & prayer" />
                <ActivityRow dotClass="bg-purple-400" text="Cultural classes (dance, yoga)" />
                <ActivityRow dotClass="bg-green-400" text="Community events" />
              </ul>
            </Card>

            {/* Donation */}
            <section className="rounded-xl shadow-md border border-gray-200 overflow-hidden relative bg-white">
              <div className="absolute top-0 right-0 p-4 opacity-10 text-7xl">
                💝
              </div>

              <div className="p-6 relative z-10">
                <h2 className="text-xl font-bold text-gray-900 mb-3">
                  Support the Temple
                </h2>
                <p className="text-gray-600 mb-6 text-sm leading-relaxed">
                  Devotees can contribute to support temple operations,
                  community programs, and cultural events.
                </p>

                <Link
                  href="/auth"
                  className={`${GRADIENT} block w-full text-center text-white py-3 px-4 rounded-lg font-bold shadow-lg hover:opacity-95 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5 active:scale-95`}
                >
                  Donate Now
                </Link>

                <p className="text-center text-xs text-gray-500 mt-3 flex items-center justify-center gap-1">
                  <span aria-hidden>🔒</span> Secure Payment
                </p>
              </div>
            </section>
          </div>
        </div>
      </section>

      {/* ================= GALLERY ================= */}
      <section className="bg-white border-t border-gray-200 py-12 mt-8">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex justify-between items-end mb-6">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <span aria-hidden>🖼️</span> Gallery
            </h2>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => scrollGallery("left")}
                className="w-9 h-9 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors"
                aria-label="Scroll left"
              >
                <IconChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => scrollGallery("right")}
                className="w-9 h-9 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors"
                aria-label="Scroll right"
              >
                <IconChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div
            ref={galleryRef}
            className="flex overflow-x-auto gap-4 pb-4 scroll-smooth snap-x snap-mandatory"
            style={{
              scrollbarWidth: "none",
              msOverflowStyle: "none",
            }}
          >
            <GalleryCard
              title="Temple Exterior"
              src="https://storage.googleapis.com/uxpilot-auth.appspot.com/f98f2d0198-ca1e79b3b51e21af1a37.png"
            />
            <GalleryCard
              title="Campus Grounds"
              src="https://storage.googleapis.com/uxpilot-auth.appspot.com/d20859c740-9ba6f9cbab459ea14729.png"
            />
            <GalleryCard
              title="Diwali Event"
              src="https://images.unsplash.com/photo-1604608678051-64d46d8d0ffe?q=80&w=2070&auto=format&fit=crop"
            />
            <GalleryCard
              title="Community Gathering"
              src="https://storage.googleapis.com/uxpilot-auth.appspot.com/a213c2b816-e7b0d07de2bca4cc918a.png"
            />
            <GalleryCard
              title="Prayer Hall"
              src="https://images.unsplash.com/photo-1582510003544-4d00b7f74220?q=80&w=2070&auto=format&fit=crop"
            />
            <GalleryCard
              title="Cultural Dance"
              src="https://storage.googleapis.com/uxpilot-auth.appspot.com/55ef176719-45c69ec71b92983ebb39.png"
            />
          </div>

          {/* hide scrollbar (webkit) */}
          <style jsx>{`
            div::-webkit-scrollbar {
              display: none;
            }
          `}</style>
        </div>
      </section>

      {/* ================= FOOTER (uDeets standard) ================= */}
      <footer className={`${GRADIENT} py-6 px-6`}>
        <div className="text-center">
          <p className="text-white text-sm">© 2026 uDeets. All rights reserved.</p>
        </div>
      </footer>
    </main>
  );
}

/* ================= Small UI Components ================= */

function Card({
  title,
  icon,
  rightLink,
  children,
  titleClass,
}: {
  title: string;
  icon?: React.ReactNode;
  rightLink?: React.ReactNode;
  children: React.ReactNode;
  titleClass?: string;
}) {
  return (
    <section className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow duration-300">
      <div className="p-6 border-b border-gray-50 flex justify-between items-center">
        <h2 className={`text-xl font-bold flex items-center gap-2 ${titleClass ?? ""}`}>
          {icon ? <span aria-hidden>{icon}</span> : null}
          {title}
        </h2>
        {rightLink}
      </div>
      <div className="p-6">{children}</div>
    </section>
  );
}

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="bg-gray-50 text-gray-800 px-3 py-1 rounded-full text-sm font-medium border border-gray-200">
      {children}
    </span>
  );
}

function TimingRow({ label, time, icon }: { label: string; time: string; icon: React.ReactNode }) {
  return (
    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center p-4 bg-gray-50 rounded-lg border border-gray-100 hover:border-cyan-200 transition-colors">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-gray-900 shadow-sm">
          <span aria-hidden>{icon}</span>
        </div>
        <span className="font-semibold text-gray-700">{label}</span>
      </div>
      <div className="mt-2 sm:mt-0 text-gray-700 font-medium bg-white px-3 py-1 rounded border border-gray-100 shadow-sm">
        {time}
      </div>
    </div>
  );
}

function EventCard({
  badge,
  badgeClass,
  title,
  desc,
  metaLeft,
  metaRight,
}: {
  badge: string;
  badgeClass: string;
  title: string;
  desc: string;
  metaLeft: string;
  metaRight: string;
}) {
  return (
    <div className="group cursor-pointer border border-gray-100 rounded-lg p-4 hover:bg-gray-50 transition-colors hover:border-cyan-200">
      <div className="flex items-start justify-between mb-3">
        <div className={`px-3 py-1 rounded text-xs font-bold uppercase tracking-wide ${badgeClass}`}>
          {badge}
        </div>
        <span className="text-gray-300 group-hover:text-gray-700 transition-colors">›</span>
      </div>

      <h3 className="font-bold text-gray-800 mb-1 group-hover:text-gray-900 transition-colors">
        {title}
      </h3>
      <p className="text-gray-500 text-sm mb-3">{desc}</p>

      <div className="flex items-center text-xs text-gray-400 gap-3">
        <span className="flex items-center gap-1">
          <span aria-hidden>📅</span> {metaLeft}
        </span>
        <span className="flex items-center gap-1">
          <span aria-hidden>📍</span> {metaRight}
        </span>
      </div>
    </div>
  );
}

function InfoRow({
  icon,
  label,
  lines,
  extra,
}: {
  icon: React.ReactNode;
  label: string;
  lines: string[];
  extra?: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-4">
      <div className="mt-1 w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-900 shrink-0">
        <span aria-hidden>{icon}</span>
      </div>
      <div>
        <p className="text-sm text-gray-500 font-medium mb-1">{label}</p>
        <p className="text-gray-800 font-medium leading-tight break-words">
          {lines.map((l, idx) => (
            <span key={idx}>
              {l}
              {idx !== lines.length - 1 ? <br /> : null}
            </span>
          ))}
        </p>
        {extra}
      </div>
    </div>
  );
}

function ActivityRow({ dotClass, text }: { dotClass: string; text: string }) {
  return (
    <li className="p-4 hover:bg-gray-50 transition-colors flex items-center justify-between group">
      <div className="flex items-center gap-3">
        <span className={`w-2 h-2 rounded-full ${dotClass}`} />
        <span className="text-gray-700 font-medium">{text}</span>
      </div>
      <span className="text-gray-300 text-xs opacity-0 group-hover:opacity-100 transition-opacity">
        →
      </span>
    </li>
  );
}

function GalleryCard({ src, title }: { src: string; title: string }) {
  return (
    <div className="min-w-[280px] md:min-w-[320px] h-56 rounded-lg overflow-hidden relative shadow-sm snap-center group">
      <Image
        src={src}
        alt={title}
        fill
        unoptimized
        className="object-cover transition-transform duration-700 group-hover:scale-110"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
        <span className="text-white font-medium text-sm">{title}</span>
      </div>
    </div>
  );
}

/* ================= Icons ================= */

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

function IconChevronLeft({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
      <path
        d="M15 18 9 12l6-6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconChevronRight({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
      <path
        d="M9 18l6-6-6-6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}