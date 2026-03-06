"use client";

import Link from "next/link";
import Image from "next/image";

// ✅ One gradient system (2-color) for ALL strips/hero/cards/cta
const GRADIENT_2 = "from-teal-500 to-cyan-500";

const steps = [
  {
    n: 1,
    title: "Create Your Profile",
    desc: "Sign up and personalize your profile with your intersets and location.",
  },
  {
    n: 2,
    title: "Subscribe or Create Hubs",
    desc: "Discover and Subscribe to existing communities or start your own hub around your passion.",
  },
  {
    n: 3,
    title: "Engage or Stay Updated",
    desc: "Engage with members and stay updated with what matters most.",
  },
];

// ✅ Use explicit href so you NEVER hit an older route by accident
const topHubs = [
  {
    name: "Hindu Center of Virginia",
    intro:
      "Temple updates, festivals, volunteer opportunities, and community announcements in one place.",
    href: "/hubs/religious-places/hindu-center-of-virginia",
  },
  {
    name: "Richmond Kannada Sangha",
    intro:
      "Cultural programs, meetups, youth activities, and local Kannada community updates.",
    href: "/hubs/communities/richmond-kannada-sangha",
  },
  {
    name: "Desi Bites",
    intro:
      "New menu drops, deals, catering info, and local foodie updates from your favorite spot.",
    // ✅ CHANGE THIS to your NEW Desi Bites route if different
    href: "/hubs/restaurants/desi-bites",
  },
];

function IconFacebook(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M13.5 22v-8h2.7l.4-3h-3.1V9.1c0-.9.3-1.5 1.6-1.5H16.7V5c-.3 0-1.3-.1-2.6-.1-2.6 0-4.3 1.6-4.3 4.5V11H7v3h2.8v8h3.7Z" />
    </svg>
  );
}

function IconInstagram(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M7.5 2h9A5.5 5.5 0 0 1 22 7.5v9A5.5 5.5 0 0 1 16.5 22h-9A5.5 5.5 0 0 1 2 16.5v-9A5.5 5.5 0 0 1 7.5 2Zm9 2h-9A3.5 3.5 0 0 0 4 7.5v9A3.5 3.5 0 0 0 7.5 20h9a3.5 3.5 0 0 0 3.5-3.5v-9A3.5 3.5 0 0 0 16.5 4Z" />
      <path d="M12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10Zm0 2a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z" />
      <path d="M17.6 6.4a1 1 0 1 1-2 0 1 1 0 0 1 2 0Z" />
    </svg>
  );
}

function IconYouTube(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M21.6 7.2a3 3 0 0 0-2.1-2.1C17.9 4.6 12 4.6 12 4.6s-5.9 0-7.5.5A3 3 0 0 0 2.4 7.2 31.3 31.3 0 0 0 2 12c0 1.7.1 3.4.4 4.8a3 3 0 0 0 2.1 2.1c1.6.5 7.5.5 7.5.5s5.9 0 7.5-.5a3 3 0 0 0 2.1-2.1c.3-1.4.4-3.1.4-4.8s-.1-3.4-.4-4.8ZM10 15.5v-7l6 3.5-6 3.5Z" />
    </svg>
  );
}

export default function Page() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* HEADER */}
      <header className={`sticky top-0 z-50 bg-gradient-to-br ${GRADIENT_2} shadow-md`}>
        <div className="flex min-h-16 w-full items-center justify-between px-4 py-2 sm:px-6 lg:px-10">
          <Link href="/" className="flex min-w-0 items-center gap-2 sm:gap-3">
            <div className="relative h-10 w-10">
              <Image
                src="/udeets-logo.png"
                alt="uDeets Logo"
                fill
                className="object-contain"
                priority
              />
            </div>
            <span className="truncate text-xl font-bold text-white sm:text-2xl">uDeets</span>
          </Link>

          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/auth"
              className="rounded-lg px-3 py-2 text-sm font-semibold text-white hover:bg-white/10 sm:px-4 sm:text-base"
            >
              Sign in
            </Link>
            <Link
              href="/auth"
              className="rounded-xl bg-white px-3 py-2 text-sm font-bold text-teal-700 shadow-lg hover:bg-white/80 sm:px-4 sm:text-base"
            >
              Get started
            </Link>
          </div>
        </div>
      </header>

      <main>
        {/* HERO (now 2-color) */}
        <section className="relative overflow-hidden">
          <div className={`absolute inset-0 bg-gradient-to-br ${GRADIENT_2}`} />

          <div className="relative mx-auto grid max-w-7xl grid-cols-1 items-center gap-10 px-4 py-12 sm:px-6 sm:py-16 lg:grid-cols-2 lg:gap-12 lg:px-10">
            {/* LEFT CONTENT */}
            <div className="max-w-3xl space-y-5 text-white sm:space-y-6">
              <div className="text-5xl font-extrabold tracking-tight sm:text-6xl lg:text-7xl">uDeets</div>

              <h1 className="break-words text-3xl font-semibold sm:text-4xl lg:text-5xl">
                Create. Subscribe. Stay Informed.
              </h1>

              <p className="text-lg text-white/90 sm:text-xl lg:text-2xl">
                Create hubs to share updates, or subscribe to receive the details
                that matter to you.
              </p>

              <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:gap-4 sm:pt-4">
                <Link
                  href="/auth"
                  className="rounded-xl bg-white px-6 py-3 text-center font-semibold text-teal-700 shadow-xl hover:bg-white/80 sm:px-8 sm:py-4"
                >
                  Get Started Free
                </Link>

                <Link
                  href="/discover"
                  className="rounded-xl border-2 border-white px-6 py-3 text-center font-semibold text-white shadow-xl hover:bg-white/10 sm:px-8 sm:py-4"
                >
                  Discover
                </Link>
              </div>
            </div>

            {/* RIGHT IMAGE (Glossy border) */}
            <div className="flex justify-center">
              <div className="relative w-full max-w-2xl">
                <div className="pointer-events-none absolute -inset-6 rounded-[2.5rem] bg-cyan-300/30 blur-3xl" />

                <div className="relative rounded-[2.5rem] p-[3px] bg-gradient-to-br from-cyan-300/70 via-white/40 to-cyan-200/70 shadow-[0_0_70px_rgba(93,191,201,0.45)]">
                  <div className="relative overflow-hidden rounded-[2.5rem] bg-white/5 backdrop-blur-sm">
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-white/20 via-transparent to-white/30" />

                    <div className="relative h-[280px] w-full sm:h-[420px] lg:h-[540px]">
                      <Image
                        src="/udeets-home.png"
                        alt="Local business owner managing updates"
                        fill
                        priority
                        className="object-cover rounded-[2.5rem]"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section className="bg-white py-20 text-center">
          <h2 className="mb-12 px-4 text-3xl font-bold sm:text-4xl">How It Works</h2>

          <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 px-4 sm:grid-cols-2 sm:px-6 lg:grid-cols-3 lg:px-10">
            {steps.map((s) => (
              <div key={s.n} className="min-w-0">
                <div
                  className={`mx-auto h-24 w-24 flex items-center justify-center rounded-full bg-gradient-to-br ${GRADIENT_2} text-white text-4xl font-bold mb-6 shadow-xl`}
                >
                  {s.n}
                </div>
                <h3 className="text-2xl font-bold mb-3">{s.title}</h3>
                <p className="text-gray-600">{s.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* TOP HUBS (now 2-color + explicit hrefs) */}
        <section className="bg-white py-20">
          <h2 className="mb-16 px-4 text-center text-3xl font-bold sm:text-4xl">Our Top Hubs</h2>

          <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 px-4 sm:grid-cols-2 sm:px-6 lg:grid-cols-3 lg:px-10">
            {topHubs.map((hub) => (
              <Link
                key={hub.name}
                href={hub.href}
                className={`group flex min-w-0 flex-col rounded-2xl bg-gradient-to-br ${GRADIENT_2} p-8 text-white shadow-lg transition hover:scale-105`}
              >
                <div className="mb-4 flex items-start justify-between gap-4">
                  <h3 className="min-w-0 break-words text-2xl font-extrabold leading-tight tracking-wide">
                    {hub.name}
                  </h3>

                  <span className="shrink-0 bg-white text-teal-700 px-3 py-1 rounded-full text-xs font-semibold">
                    Public
                  </span>
                </div>

                <p className="mb-6 break-words text-white/90">{hub.intro}</p>

                <div className="mt-auto bg-white text-teal-700 py-2 rounded-xl text-center font-semibold">
                  View Hub
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* FOOTER */}
        <footer className={`bg-gradient-to-br ${GRADIENT_2}`}>
          <div className="mx-auto flex min-h-16 max-w-7xl flex-col items-center justify-between gap-2 px-4 py-3 text-center text-white sm:flex-row sm:px-6 sm:text-left lg:px-10">
            <p className="text-sm sm:text-base">© uDeets. All rights reserved.</p>
            <div className="flex gap-5">
              <IconFacebook className="h-6 w-6 hover:text-white/80 cursor-pointer" />
              <IconInstagram className="h-6 w-6 hover:text-white/80 cursor-pointer" />
              <IconYouTube className="h-6 w-6 hover:text-white/80 cursor-pointer" />
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}
