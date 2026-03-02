// apps/web/app/discover/_views/ReligiousView.tsx
"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";

const GRADIENT = "bg-gradient-to-br from-teal-600 via-cyan-700 to-blue-800";

type FaithType = "All" | "Temple" | "Church" | "Mosque" | "Gurdwara";

export type HubFromApi = {
  id: string;
  name: string;
  slug: string;
  category: "religious" | "restaurants" | "communities";
  city?: string;
  state?: string;
};

type ReligiousHubVM = {
  title: string;
  slugHref: string;
  location: string;
  visibility: "Public" | "Private";
  type: Exclude<FaithType, "All">;
  description: string;
  emoji: string;
  imageSrc?: string;
  source: "api" | "mock";
};

const FILTERS: FaithType[] = ["All", "Temple", "Church", "Mosque", "Gurdwara"];

function buildLocation(city?: string, state?: string) {
  const c = (city || "").trim();
  const s = (state || "").trim();
  if (c && s) return `${c}, ${s}`;
  if (c) return c;
  if (s) return s;
  return "Local";
}

function inferType(name: string, slug: string): Exclude<FaithType, "All"> {
  const s = slug.toLowerCase();
  const n = name.toLowerCase();
  if (s.includes("gurdwara") || n.includes("gurdwara") || n.includes("sikh")) return "Gurdwara";
  if (s.includes("mosque") || n.includes("mosque") || n.includes("islam")) return "Mosque";
  if (s.includes("church") || n.includes("church")) return "Church";
  return "Temple";
}

function emojiForType(t: Exclude<FaithType, "All">) {
  if (t === "Temple") return "🕉️";
  if (t === "Church") return "✝️";
  if (t === "Mosque") return "☪️";
  return "🪯";
}

// Optional: if you have an image in public, map it here by slug.
// Example: public/hubs/hindu-centre.jpg  => "/hubs/hindu-centre.jpg"
const IMAGE_BY_SLUG: Record<string, string> = {
  // "hindu-center-of-virginia": "/hubs/hindu-centre.jpg",
};

// Your old demo hubs (so the grid looks rich even before you build those pages)
const MOCK_HUBS: ReligiousHubVM[] = [
  {
    title: "Richmond Community Church",
    slugHref: "/auth",
    location: "Richmond, VA",
    visibility: "Public",
    type: "Church",
    description: "Worship services, youth groups, and community outreach updates.",
    emoji: "✝️",
    source: "mock",
  },
  {
    title: "Islamic Center of Richmond",
    slugHref: "/auth",
    location: "Richmond, VA",
    visibility: "Public",
    type: "Mosque",
    description: "Prayer times, Ramadan announcements, and community programs.",
    emoji: "☪️",
    source: "mock",
  },
  {
    title: "Sikh Gurdwara (Virginia)",
    slugHref: "/auth",
    location: "Henrico, VA",
    visibility: "Public",
    type: "Gurdwara",
    description: "Kirtan schedule, langar updates, and community seva opportunities.",
    emoji: "🪯",
    source: "mock",
  },
  {
    title: "Shirdi Sai Baba Temple",
    slugHref: "/auth",
    location: "Chesterfield, VA",
    visibility: "Public",
    type: "Temple",
    description: "Aarti timings, festival calendar, and volunteer opportunities.",
    emoji: "🌺",
    source: "mock",
  },
];

export default function ReligiousView({ hubs }: { hubs: HubFromApi[] }) {
  const [active, setActive] = useState<FaithType>("All");
  const [query, setQuery] = useState("");

  // ✅ IMPORTANT: your real hub pages live under /hubs/religious-places/<slug>
  const HUB_PREFIX = "/hubs/religious-places";

  const apiHubsVM: ReligiousHubVM[] = useMemo(() => {
    return hubs.map((h) => {
      const t = inferType(h.name, h.slug);
      return {
        title: h.name,
        slugHref: `${HUB_PREFIX}/${h.slug}`, // ✅ fixes the 404
        location: buildLocation(h.city, h.state),
        visibility: "Public",
        type: t,
        description:
          "Religious & cultural hub for events, announcements, and community updates.",
        emoji: emojiForType(t),
        imageSrc: IMAGE_BY_SLUG[h.slug],
        source: "api",
      };
    });
  }, [hubs]);

  const allHubs: ReligiousHubVM[] = useMemo(() => {
    const seen = new Set(apiHubsVM.map((h) => h.title.toLowerCase()));
    const merged = [...apiHubsVM];
    for (const m of MOCK_HUBS) {
      if (!seen.has(m.title.toLowerCase())) merged.push(m);
    }
    return merged;
  }, [apiHubsVM]);

  const featured = allHubs[0];

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return allHubs.filter((h) => {
      const matchesType = active === "All" ? true : h.type === active;
      const matchesQuery =
        !q ||
        h.title.toLowerCase().includes(q) ||
        h.location.toLowerCase().includes(q) ||
        h.description.toLowerCase().includes(q);

      return matchesType && matchesQuery;
    });
  }, [active, query, allHubs]);

  return (
    <main className="min-h-screen bg-white">
      {/* TOP STRIP */}
      <header className={GRADIENT}>
        <div className="w-full px-4 sm:px-6 lg:px-10 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3">
              <div className="relative h-10 w-10">
                <Image
                  src="/udeets-logo.png"
                  alt="uDeets"
                  fill
                  className="object-contain"
                  priority
                />
              </div>
              <span className="text-white font-extrabold text-2xl tracking-tight">
                uDeets
              </span>
            </Link>

            <div className="flex items-center gap-2">
              <Link
                href="/discover"
                className="text-white font-semibold px-5 py-2.5 rounded-2xl hover:bg-white/10 transition-all duration-300"
              >
                Discover
              </Link>
              <Link
                href="/"
                className="text-white font-semibold px-5 py-2.5 rounded-2xl hover:bg-white/10 transition-all duration-300"
              >
                Home
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className={`relative overflow-hidden ${GRADIENT}`}>
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="absolute -top-24 -left-24 w-[320px] h-[320px] bg-white rounded-full blur-3xl" />
          <div className="absolute -bottom-32 -right-32 w-[420px] h-[420px] bg-white rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto px-6 lg:px-8 pt-16 pb-12">
          <div className="max-w-3xl">
            <h1 className="text-white text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight">
              Religious Places
            </h1>
            <p className="text-white/90 mt-4 text-base sm:text-lg max-w-2xl">
              Discover spiritual communities and sacred spaces near you. Subscribe to hubs
              to stay updated on events, announcements, and celebrations.
            </p>
          </div>

          {/* Search */}
          <div className="mt-10">
            <div className="relative max-w-2xl">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search temples, churches, mosques, gurdwaras…"
                className="w-full px-6 py-4 rounded-2xl bg-white shadow-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-4 focus:ring-white/30 transition-all pr-[120px]"
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 bg-gradient-to-br from-teal-600 to-cyan-700 text-white px-5 py-2.5 rounded-xl font-extrabold shadow-xl hover:scale-105 transition-transform duration-300"
              >
                Search
              </button>
            </div>

            {/* Filter chips */}
            <div className="mt-6 flex flex-wrap gap-3">
              {FILTERS.map((t) => {
                const isActive = active === t;
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setActive(t)}
                    className={[
                      "px-4 py-2 rounded-full text-sm font-semibold transition-all",
                      isActive
                        ? "bg-white text-teal-700 shadow-md"
                        : "bg-white/15 text-white hover:bg-white/25 border border-white/20",
                    ].join(" ")}
                  >
                    {t}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* CONTENT */}
      <section className="bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-14">
          <div className="flex items-end justify-between gap-6 mb-8">
            <div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900">
                Featured Hub
              </h2>
              <p className="text-gray-600 mt-2">
                A top hub in your area — subscribe to get updates.
              </p>
            </div>

            <div className="text-sm text-gray-500">
              Showing{" "}
              <span className="font-semibold text-gray-900">{filtered.length}</span>{" "}
              hubs
            </div>
          </div>

          {featured ? (
            <FeaturedHubCard hub={featured} />
          ) : (
            <div className="rounded-3xl border border-gray-200 p-8 text-gray-700">
              No hubs found yet.
            </div>
          )}

          <div className="mt-12">
            <div className="flex items-center justify-between gap-6 mb-6">
              <h3 className="text-xl sm:text-2xl font-extrabold text-gray-900">
                Explore Hubs
              </h3>
              <div className="text-sm text-gray-600 hidden md:block">
                Filter by <span className="font-semibold">Temple</span>,{" "}
                <span className="font-semibold">Church</span>,{" "}
                <span className="font-semibold">Mosque</span>,{" "}
                <span className="font-semibold">Gurdwara</span>.
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map((hub) => (
                <HubCard key={`${hub.source}:${hub.title}`} hub={hub} />
              ))}
            </div>
          </div>

          <div className="mt-14">
            <div className={`${GRADIENT} rounded-3xl p-10 sm:p-12 relative overflow-hidden`}>
              <div className="absolute inset-0 opacity-10 pointer-events-none">
                <div className="absolute -top-24 -left-24 w-[320px] h-[320px] bg-white rounded-full blur-3xl" />
                <div className="absolute -bottom-32 -right-32 w-[420px] h-[420px] bg-white rounded-full blur-3xl" />
              </div>

              <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-8">
                <div className="max-w-2xl">
                  <h3 className="text-white text-2xl sm:text-3xl font-extrabold">
                    Don&apos;t see your religious place?
                  </h3>
                  <p className="text-white/90 mt-2">
                    Create a hub so members can subscribe to announcements, events, and updates.
                  </p>
                </div>

                <Link
                  href="/auth"
                  className="inline-flex items-center justify-center bg-white text-teal-700 px-8 py-4 rounded-2xl font-extrabold hover:scale-105 hover:shadow-2xl transition-all duration-300 whitespace-nowrap"
                >
                  Create a Hub
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className={GRADIENT}>
        <div className="w-full px-4 sm:px-6 lg:px-10">
          <div className="h-16 flex items-center justify-center text-white/90 text-sm">
            © 2026 uDeets. All rights reserved.
          </div>
        </div>
      </footer>
    </main>
  );
}

/* ================= COMPONENTS ================= */

function FeaturedHubCard({ hub }: { hub: ReligiousHubVM }) {
  return (
    <Link
      href={hub.slugHref}
      className="group block rounded-3xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-xl transition-all"
      aria-label={`Open ${hub.title}`}
    >
      <div className="grid grid-cols-1 lg:grid-cols-12">
        <div className="relative lg:col-span-5 min-h-[260px] overflow-hidden">
          {hub.imageSrc ? (
            <>
              <Image src={hub.imageSrc} alt={hub.title} fill className="object-cover" priority />
              <div className="absolute inset-0 bg-gradient-to-br from-black/45 via-black/25 to-black/15" />
              <div className="absolute left-8 bottom-8">
                <div className="inline-flex items-center gap-3 rounded-2xl bg-white/10 border border-white/20 px-4 py-3 backdrop-blur">
                  <span className="text-2xl">{hub.emoji}</span>
                  <div className="text-white">
                    <div className="font-extrabold leading-tight">{hub.title}</div>
                    <div className="text-white/85 text-sm">{hub.location}</div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className={`${GRADIENT} h-full w-full p-10 flex items-center justify-center`}>
              <div className="w-24 h-24 rounded-3xl bg-white/15 border border-white/25 flex items-center justify-center text-5xl text-white">
                {hub.emoji}
              </div>
            </div>
          )}
        </div>

        <div className="lg:col-span-7 p-8 sm:p-10 bg-white">
          <div className="flex flex-wrap gap-2 mb-4">
            <Badge>{hub.location}</Badge>
            <Badge>{hub.visibility}</Badge>
            <Badge>{hub.type}</Badge>
          </div>

          <h3 className="text-2xl sm:text-3xl font-extrabold text-gray-900 group-hover:text-teal-700 transition-colors">
            {hub.title}
          </h3>

          <p className="text-gray-600 mt-3 max-w-2xl">{hub.description}</p>

          <div className="mt-7 flex items-center gap-3">
            <span className="ml-auto inline-flex items-center justify-center bg-gradient-to-br from-teal-600 to-cyan-700 text-white px-6 py-3 rounded-2xl font-extrabold shadow-sm group-hover:shadow-lg transition-all">
              Subscribe
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

function HubCard({ hub }: { hub: ReligiousHubVM }) {
  return (
    <Link
      href={hub.slugHref}
      className="group block bg-white border border-gray-200 rounded-3xl overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all"
      aria-label={`Open ${hub.title}`}
    >
      <div className="p-7">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap gap-2 mb-3">
              <Badge>{hub.location}</Badge>
              <Badge>{hub.visibility}</Badge>
              <Badge>{hub.type}</Badge>
            </div>

            <h4 className="text-lg font-extrabold text-gray-900 group-hover:text-teal-700 transition-colors">
              {hub.title}
            </h4>

            <p className="text-gray-600 text-sm mt-2">{hub.description}</p>
          </div>

          <div className={`${GRADIENT} w-14 h-14 rounded-2xl flex items-center justify-center shrink-0`}>
            <span className="text-white text-2xl">{hub.emoji}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 text-xs font-semibold px-3 py-1 rounded-full bg-gray-100 text-gray-800">
      {children}
    </span>
  );
}