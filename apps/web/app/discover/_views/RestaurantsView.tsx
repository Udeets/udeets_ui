"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";

const GRADIENT = "bg-gradient-to-br from-teal-600 via-cyan-700 to-blue-800";

export type HubFromApi = {
  id: string;
  name: string;
  slug: string;
  category: "religious" | "restaurants" | "communities";
  city?: string;
  state?: string;
};

type RestaurantVM = {
  title: string;
  slugHref: string;
  location: string;
  visibility: "Public" | "Private";
  typeLabel: "Restaurant";
  description: string;
  emoji: string;
  source: "api" | "mock";
};

function buildLocation(city?: string, state?: string) {
  const c = (city || "").trim();
  const s = (state || "").trim();
  if (c && s) return `${c}, ${s}`;
  if (c) return c;
  if (s) return s;
  return "Local";
}

const MOCK_HUBS: RestaurantVM[] = [
  {
    title: "Desi Bites",
    slugHref: "/hubs/restaurants/desi-bites",
    location: "Richmond, VA",
    visibility: "Public",
    typeLabel: "Restaurant",
    description: "Deals, menu highlights, and weekly specials from the community’s favorite spot.",
    emoji: "🍛",
    source: "mock",
  },
  {
    title: "Spice Route Kitchen",
    slugHref: "/auth",
    location: "Glen Allen, VA",
    visibility: "Public",
    typeLabel: "Restaurant",
    description: "New dishes, catering updates, and seasonal offers.",
    emoji: "🌶️",
    source: "mock",
  },
  {
    title: "Tandoori House",
    slugHref: "/auth",
    location: "Henrico, VA",
    visibility: "Public",
    typeLabel: "Restaurant",
    description: "Lunch combos, weekend buffets, and event catering updates.",
    emoji: "🥘",
    source: "mock",
  },
];

export default function RestaurantsView({ hubs }: { hubs: HubFromApi[] }) {
  const [query, setQuery] = useState("");

  const HUB_PREFIX = "/hubs/restaurants";

  const apiVM: RestaurantVM[] = useMemo(() => {
    return hubs.map((h) => ({
      title: h.name,
      slugHref: `${HUB_PREFIX}/${h.slug}`,
      location: buildLocation(h.city, h.state),
      visibility: "Public",
      typeLabel: "Restaurant",
      description: "Deals, announcements, and updates from your local favorites.",
      emoji: "🍽️",
      source: "api",
    }));
  }, [hubs]);

  const all = useMemo(() => {
    const seen = new Set(apiVM.map((h) => h.title.toLowerCase()));
    const merged = [...apiVM];
    for (const m of MOCK_HUBS) {
      if (!seen.has(m.title.toLowerCase())) merged.push(m);
    }
    return merged;
  }, [apiVM]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return all.filter((h) => {
      if (!q) return true;
      return (
        h.title.toLowerCase().includes(q) ||
        h.location.toLowerCase().includes(q) ||
        h.description.toLowerCase().includes(q)
      );
    });
  }, [query, all]);

  const featured = all[0];

  return (
    <main className="min-h-screen bg-white">
      {/* TOP STRIP */}
      <header className={GRADIENT}>
        <div className="w-full px-4 sm:px-6 lg:px-10 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3">
              <div className="relative h-10 w-10">
                <Image src="/udeets-logo.png" alt="uDeets" fill className="object-contain" priority />
              </div>
              <span className="text-white font-extrabold text-2xl tracking-tight">uDeets</span>
            </Link>

            <div className="flex items-center gap-2">
              <Link href="/discover" className="text-white font-semibold px-5 py-2.5 rounded-2xl hover:bg-white/10 transition-all">
                Discover
              </Link>
              <Link href="/" className="text-white font-semibold px-5 py-2.5 rounded-2xl hover:bg-white/10 transition-all">
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
              Restaurants
            </h1>
            <p className="text-white/90 mt-4 text-base sm:text-lg max-w-2xl">
              Find local favorites and subscribe to get deals, specials, and community updates.
            </p>
          </div>

          <div className="mt-10">
            <div className="relative max-w-2xl">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search restaurants, deals, or cuisines…"
                className="w-full px-6 py-4 rounded-2xl bg-white shadow-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-4 focus:ring-white/30 transition-all pr-[120px]"
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 bg-gradient-to-br from-teal-600 to-cyan-700 text-white px-5 py-2.5 rounded-xl font-extrabold shadow-xl hover:scale-105 transition-transform"
              >
                Search
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* CONTENT */}
      <section className="bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-14">
          <div className="flex items-end justify-between gap-6 mb-8">
            <div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900">Featured Hub</h2>
              <p className="text-gray-600 mt-2">A top restaurant hub — subscribe for updates.</p>
            </div>
            <div className="text-sm text-gray-500">
              Showing <span className="font-semibold text-gray-900">{filtered.length}</span> hubs
            </div>
          </div>

          {featured ? <FeaturedCard hub={featured} /> : null}

          <div className="mt-12">
            <h3 className="text-xl sm:text-2xl font-extrabold text-gray-900 mb-6">Explore Hubs</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map((hub) => (
                <Card key={`${hub.source}:${hub.title}`} hub={hub} />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
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

function FeaturedCard({ hub }: { hub: RestaurantVM }) {
  return (
    <Link
      href={hub.slugHref}
      className="group block rounded-3xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-xl transition-all"
    >
      <div className="grid grid-cols-1 lg:grid-cols-12">
        <div className={`${GRADIENT} lg:col-span-5 min-h-[260px] flex items-center justify-center`}>
          <div className="w-24 h-24 rounded-3xl bg-white/15 border border-white/25 flex items-center justify-center text-5xl text-white">
            {hub.emoji}
          </div>
        </div>

        <div className="lg:col-span-7 p-8 sm:p-10 bg-white">
          <div className="flex flex-wrap gap-2 mb-4">
            <Badge>{hub.location}</Badge>
            <Badge>{hub.visibility}</Badge>
            <Badge>{hub.typeLabel}</Badge>
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

function Card({ hub }: { hub: RestaurantVM }) {
  return (
    <Link
      href={hub.slugHref}
      className="group block bg-white border border-gray-200 rounded-3xl overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all"
    >
      <div className="p-7">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap gap-2 mb-3">
              <Badge>{hub.location}</Badge>
              <Badge>{hub.visibility}</Badge>
              <Badge>{hub.typeLabel}</Badge>
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