import Link from "next/link";
import Image from "next/image";

const steps = [
  {
    n: 1,
    title: "Create Your Profile",
    desc: "Sign up and personalize your profile with your intersets and location.",
    gradient: "from-teal-600 via-cyan-700 to-blue-800",
  },
  {
    n: 2,
    title: "Subscribe or Create Hubs",
    desc: "Discover and Subscribe to existing communities or start your own hub around your passion.",
    gradient: "from-teal-600 via-cyan-700 to-blue-800",
  },
  {
    n: 3,
    title: "Engage or Stay Updated",
    desc: "Engage with members and stay updated with what matters most.",
    gradient: "from-teal-600 via-cyan-700 to-blue-800",
  },
];

const topHubs = [
  {
    category: "religious-places",
    slug: "hindu-center-of-virginia",
    name: "Hindu Center of Virginia",
    intro:
      "Temple updates, festivals, volunteer opportunities, and community announcements in one place.",
  },
  {
    category: "communities",
    slug: "richmond-kannada-sangha",
    name: "Richmond Kannada Sangha",
    intro:
      "Cultural programs, meetups, youth activities, and local Kannada community updates.",
  },
  {
    category: "restaurants",
    slug: "desi-bites",
    name: "Desi Bites",
    intro:
      "New menu drops, deals, catering info, and local foodie updates from your favorite spot.",
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
      <header className="sticky top-0 z-50 bg-gradient-to-br from-teal-600 via-cyan-700 to-blue-800 shadow-md">
        <div className="flex h-16 items-center justify-between px-6 lg:px-10">
          <div className="flex items-center gap-3">
            <div className="relative h-10 w-10">
              <Image
                src="/udeets-logo.png"
                alt="uDeets Logo"
                fill
                className="object-contain"
                priority
              />
            </div>
            <span className="text-2xl font-bold text-white">uDeets</span>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/auth"
              className="px-4 py-2 text-white font-semibold hover:bg-white/10 rounded-lg"
            >
              Sign in
            </Link>
            <Link
              href="/auth"
              className="bg-white text-teal-700 px-4 py-2 rounded-xl font-bold shadow-lg hover:bg-cyan-50"
            >
              Get started
            </Link>
          </div>
        </div>
      </header>

      <main>
        {/* HERO */}
        <section className="relative h-[600px] overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-teal-600 via-cyan-700 to-blue-800" />

          <div className="relative mx-auto flex h-full max-w-7xl items-center px-6 lg:px-8">
            <div className="space-y-6 text-white max-w-3xl">
              <div className="text-7xl font-extrabold tracking-tight">uDeets</div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-semibold whitespace-nowrap">
                Create. Subscribe. Stay Informed.
              </h1>

              <p className="text-xl sm:text-2xl text-cyan-100">
                Create hubs to share updates, or subscribe to receive the details
                that matter to you.
              </p>

              {/* Discover button added */}
              <div className="flex gap-4 pt-4">
                <Link
                  href="/auth"
                  className="bg-white text-teal-700 px-8 py-4 rounded-xl font-semibold shadow-xl hover:bg-cyan-50"
                >
                  Get Started Free
                </Link>

                <Link
                  href="/discover"
                  className="border-2 border-white text-white px-8 py-4 rounded-xl font-semibold shadow-xl hover:bg-white/10"
                >
                  Discover
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section className="bg-white py-20 text-center">
          <h2 className="text-4xl font-bold mb-12">How It Works</h2>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto px-6">
            {steps.map((s) => (
              <div key={s.n}>
                <div
                  className={`mx-auto h-24 w-24 flex items-center justify-center rounded-full bg-gradient-to-br ${s.gradient} text-white text-4xl font-bold mb-6 shadow-xl`}
                >
                  {s.n}
                </div>
                <h3 className="text-2xl font-bold mb-3">{s.title}</h3>
                <p className="text-gray-600">{s.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* TOP HUBS */}
        <section className="bg-white py-20">
          <h2 className="text-4xl font-bold text-center mb-16">Our Top Hubs</h2>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto px-6">
            {topHubs.map((hub) => (
              <Link
                key={hub.slug}
                href={`/hubs/${hub.category}/${hub.slug}`}
                className="group flex flex-col rounded-2xl bg-gradient-to-br from-teal-600 via-cyan-700 to-blue-800 p-8 text-white shadow-lg hover:scale-105 transition"
              >
                {/* ✅ FIX: keep badge aligned like earlier by making header row items-start */}
                <div className="flex items-start justify-between mb-4 gap-4">
                  <h3 className="font-extrabold text-2xl tracking-wide leading-tight">
                    {hub.name}
                  </h3>

                  <span className="shrink-0 bg-white text-teal-700 px-3 py-1 rounded-full text-xs font-semibold">
                    Public
                  </span>
                </div>

                <p className="text-white/90 mb-6">{hub.intro}</p>

                <div className="mt-auto bg-white text-teal-700 py-2 rounded-xl text-center font-semibold">
                  View Hub
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* FOOTER */}
        <footer className="bg-gradient-to-br from-teal-600 via-cyan-700 to-blue-800">
          <div className="flex h-16 items-center justify-between px-6 lg:px-10 text-white">
            <p>© uDeets. All rights reserved.</p>
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