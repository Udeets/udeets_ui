import Image from "next/image";
import Link from "next/link";

const BRAND = {
  primary: "#0E5A64",
  hover: "#0B4D55",
  background: "#EAF6F1",
};

export default function HomePage() {
  return (
    <main className="min-h-screen" style={{ backgroundColor: BRAND.background }}>
      
      {/* ================= HEADER (TRUE EDGE) ================= */}
      <header className="h-20" style={{ backgroundColor: BRAND.primary }}>
        <div className="flex h-full w-full items-center justify-between px-8">
          
          <Link href="/" className="flex items-center gap-3">
            <Image
              src="/udeets-logo.png"
              alt="uDeets Logo"
              width={64}
              height={64}
              priority
              className="h-14 w-14"
            />
            <span className="text-xl font-semibold text-[#EAF6F1]">
              uDeets
            </span>
          </Link>

          <div className="flex items-center gap-4">
            <Link
              href="/auth"
              className="rounded-xl px-4 py-2 font-medium text-white hover:bg-white/10 transition"
            >
              Sign In
            </Link>

            <Link
              href="/auth"
              className="rounded-xl bg-white px-6 py-2 font-medium transition hover:bg-gray-100"
              style={{ color: BRAND.primary }}
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* ================= HERO ================= */}
      <section className="py-20 lg:py-32">
        <div className="mx-auto max-w-4xl px-6 text-center lg:px-8">
          
          <h1 className="mb-6 text-5xl font-bold text-gray-900 lg:text-6xl">
            uDeets
          </h1>

          <h2 className="mb-8 text-2xl font-semibold text-gray-900 lg:text-3xl">
            Information that matters. Portal that connects
          </h2>

          <p className="mx-auto mb-12 max-w-3xl text-lg leading-relaxed text-gray-600">
            uDeets is a community hub platform for diverse communities, religious
            groups, associations and local businesses. Businesses broadcast and
            subscribers subscribe to the hubs that matter to them and stay
            informed about announcements, offers, events and updates. All in one place!
          </p>

          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/hub"
              className="w-full sm:w-auto rounded-xl border-2 px-8 py-3 font-medium transition-all hover:bg-[#0E5A64] hover:text-white"
              style={{
                borderColor: BRAND.primary,
                color: BRAND.primary,
              }}
            >
              Discover Hubs
            </Link>

            <Link
              href="/auth"
              className="w-full sm:w-auto rounded-xl px-8 py-3 font-medium text-white transition hover:bg-[#0B4D55]"
              style={{ backgroundColor: BRAND.primary }}
            >
              Get Started
            </Link>
          </div>
        </div>
      </section>

      {/* ================= FEATURES ================= */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          
          <h2 className="mb-16 text-center text-3xl font-bold text-gray-900 lg:text-4xl">
            Features
          </h2>

          <div className="grid gap-12 md:grid-cols-3">
            <FeatureCard
              title="Community Hubs"
              description="Connect with your local communities through dedicated hubs for every group and organization."
            />
            <FeatureCard
              title="Stay Informed"
              description="Get real-time updates on events, announcements, and important information from your communities."
            />
            <FeatureCard
              title="Engage Locally"
              description="Participate actively in your local community through events, discussions, and collaborative activities."
            />
          </div>
        </div>
      </section>

      {/* ================= BUILT FOR COMMUNITY ================= */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          
          <h2 className="mb-16 text-center text-3xl font-bold text-gray-900 lg:text-4xl">
            Built for Every Community
          </h2>

          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            {[
              "Religious Groups",
              "HOAs",
              "Schools",
              "Sports Clubs",
              "Local Businesses",
              "Social Clubs",
              "Non-Profits",
              "Professional Networks",
            ].map((item) => (
              <div
                key={item}
                className="rounded-2xl bg-white p-6 text-center shadow-sm"
              >
                <h3 className="font-semibold text-gray-900">{item}</h3>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= HOW IT WORKS ================= */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          
          <h2 className="mb-16 text-center text-3xl font-bold text-gray-900 lg:text-4xl">
            How uDeets works
          </h2>

          <div className="grid gap-12 md:grid-cols-3">
            <StepCard number="1" title="Sign Up" description="Create your account quickly." />
            <StepCard number="2" title="Discover or Create" description="Find existing hubs or create one for your community." />
            <StepCard number="3" title="Engage or Subscribe" description="Subscribe to hubs and stay connected through updates, events, and announcements." />
          </div>
        </div>
      </section>

      {/* ================= CTA ================= */}
      <section className="py-20">
        <div className="mx-auto max-w-4xl px-6 lg:px-8">
          
          <div
            className="rounded-3xl p-12 text-center"
            style={{ backgroundColor: BRAND.primary }}
          >
            <h2 className="mb-8 text-3xl font-bold text-white lg:text-4xl">
              Ready to engage with your communities around you?
            </h2>

            <Link
              href="/auth"
              className="inline-block rounded-xl bg-white px-8 py-4 text-lg font-semibold transition hover:bg-gray-100"
              style={{ color: BRAND.primary }}
            >
              Get Started Now
            </Link>
          </div>
        </div>
      </section>

      {/* ================= FOOTER ================= */}
      <footer className="border-t border-gray-200 bg-white py-8">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <p className="text-gray-600">
              © 2026 uDeets. All rights reserved.
            </p>

            <div className="flex items-center gap-6 text-gray-600">
              <a href="#" aria-label="Facebook" className="hover:text-[#0E5A64] transition">
                <FacebookIcon className="h-5 w-5" />
              </a>
              <a href="#" aria-label="Instagram" className="hover:text-[#0E5A64] transition">
                <InstagramIcon className="h-5 w-5" />
              </a>
              <a href="#" aria-label="YouTube" className="hover:text-[#0E5A64] transition">
                <YouTubeIcon className="h-5 w-5" />
              </a>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}

/* ================= SMALL COMPONENTS ================= */

function FeatureCard({ title, description }: { title: string; description: string }) {
  return (
    <div className="text-center">
      <h3 className="mb-4 text-xl font-semibold text-gray-900">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  );
}

function StepCard({ number, title, description }: { number: string; title: string; description: string }) {
  return (
    <div className="text-center">
      <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-[#0E5A64] text-xl font-bold text-white">
        {number}
      </div>
      <h3 className="mb-4 text-xl font-semibold text-gray-900">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  );
}

/* ================= ICONS ================= */

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M22 12a10 10 0 1 0-11.6 9.9v-7H8v-2.9h2.4V9.8c0-2.4 1.4-3.7 3.6-3.7 1 0 2 .2 2 .2v2.3h-1.1c-1.1 0-1.4.7-1.4 1.4v1.7H16l-.4 2.9h-2.2v7A10 10 0 0 0 22 12z" />
    </svg>
  );
}

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5zm10 2H7a3 3 0 0 0-3 3v10a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3V7a3 3 0 0 0-3-3z"/>
      <circle cx="12" cy="12" r="3"/>
      <circle cx="17.5" cy="6.5" r="1"/>
    </svg>
  );
}

function YouTubeIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M21.6 7.2a3 3 0 0 0-2.1-2.1C17.7 4.6 12 4.6 12 4.6s-5.7 0-7.5.5A3 3 0 0 0 2.4 7.2A31.6 31.6 0 0 0 2 12a31.6 31.6 0 0 0 .4 4.8 3 3 0 0 0 2.1 2.1c1.8.5 7.5.5 7.5.5s5.7 0 7.5-.5a3 3 0 0 0 2.1-2.1A31.6 31.6 0 0 0 22 12a31.6 31.6 0 0 0-.4-4.8zM10 15.5v-7l6 3.5-6 3.5z" />
    </svg>
  );
}