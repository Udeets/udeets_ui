"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";

// ✅ Final uDeets 2-color gradient (new one you selected)
const GRADIENT = "bg-gradient-to-br from-teal-600 to-cyan-700";

export type HubFromApi = {
  id: string;
  name: string;
  slug: string;
  category: "religious" | "restaurants" | "communities";
  city?: string;
  state?: string;
};

type CommunityVM = {
  title: string;
  slugHref: string;
  location: string;
  visibility: "Public" | "Private";
  typeLabel: "Community";
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

const MOCK_HUBS: CommunityVM[] = [
  {
    title: "Richmond Kannada Sangha",
    slugHref: "/hubs/communities/richmond-kannada-sangha",
    location: "Richmond, VA",
    visibility: "Public",
    typeLabel: "Community",
    description: "Events, announcements, and cultural programs for the Kannada community.",
    emoji: "👥",
    source: "mock",
  },
  {
    title: "Neighborhood Volunteers",
    slugHref: "/auth",
    location: "Glen Allen, VA",
    visibility: "Public",
    typeLabel: "Community",
    description: "Volunteer opportunities, meetups, and neighborhood support updates.",
    emoji: "🤝",
    source: "mock",
  },
  {
    title: "Local Sports Group",
    slugHref: "/auth",
    location: "Henrico, VA",
    visibility: "Public",
    typeLabel: "Community",
    description: "Practice schedules, game updates, and community sports events.",
    emoji: "🏀",
    source: "mock",
  },
];

// ✅ Map hub slug -> DP image (use your exact filename)
const HUB_IMAGE_BY_SLUG: Record<string, string> = {
  "richmond-kannada-sangha": "/hub-images/richmond-kannada-sangha-dp.jpg",
  // add more as you create them:
  // "some-community": "/hub-images/some-community-dp.jpg",
};

const DEFAULT_HUB_IMAGE = "/hub-images/default.jpg";

function getHubImageFromHref(slugHref: string) {
  const slug = slugHref.split("/").filter(Boolean).pop() || "";
  return HUB_IMAGE_BY_SLUG[slug] ?? DEFAULT_HUB_IMAGE;
}

export default function CommunitiesView({ hubs }: { hubs: HubFromApi[] }) {
  const [query, setQuery] = useState("");

  const HUB_PREFIX = "/hubs/communities";

  const apiVM: CommunityVM[] = useMemo(() => {
    return hubs.map((h) => ({
      title: h.name,
      slugHref: `${HUB_PREFIX}/${h.slug}`,
      location: buildLocation(h.city, h.state),
      visibility: "Public",
      typeLabel: "Community",
      description: "Announcements, events, and updates from your communities.",
      emoji: "👥",
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
              <Link
                href="/discover"
                className="text-white font-semibold px-5 py-2.5 rounded-2xl hover:bg-white/10 transition-all"
              >
                Discover
              </Link>
              <Link
                href="/"
                className="text-white font-semibold px-5 py-2.5 rounded-2xl hover:bg-white/10 transition-all"
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
              Communities
            </h1>
            <p className="text-white/90 mt-4 text-base sm:text-lg max-w-2xl">
              Join local groups and stay in the loop on events, announcements, and meetups.
            </p>
          </div>

          <div className="mt-10">
            <div className="relative max-w-2xl">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search communities, groups, or events…"
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
              <p className="text-gray-600 mt-2">A top community hub — subscribe for updates.</p>
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

function FeaturedCard({ hub }: { hub: CommunityVM }) {
  const img = getHubImageFromHref(hub.slugHref);

  return (
    <Link
      href={hub.slugHref}
      className="group block rounded-3xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-xl transition-all"
    >
      <div className="grid grid-cols-1 lg:grid-cols-12">
        {/* LEFT — DP/cover image */}
        <div className="relative lg:col-span-5 min-h-[260px]">
          <Image src={img} alt={`${hub.title} cover`} fill className="object-cover" priority />
          <div className="absolute inset-0 bg-gradient-to-tr from-black/35 via-black/10 to-transparent" />

          <div className="absolute left-6 top-6 inline-flex items-center gap-2 rounded-full bg-white/15 border border-white/25 px-4 py-2 text-sm font-semibold text-white backdrop-blur">
            {hub.emoji} <span>{hub.visibility}</span>
          </div>
        </div>

        {/* RIGHT — gradient + white text (your requested change) */}
        <div className={`lg:col-span-7 p-8 sm:p-10 ${GRADIENT} text-white`}>
          <div className="flex flex-wrap gap-2 mb-4">
            <BadgeOnDark>{hub.location}</BadgeOnDark>
            <BadgeOnDark>{hub.visibility}</BadgeOnDark>
            <BadgeOnDark>{hub.typeLabel}</BadgeOnDark>
          </div>

          <h3 className="text-2xl sm:text-3xl font-extrabold text-white">{hub.title}</h3>

          <p className="text-white/90 mt-3 max-w-2xl">{hub.description}</p>

          <div className="mt-7 flex items-center gap-3">
            <span className="ml-auto inline-flex items-center justify-center bg-white text-teal-800 px-6 py-3 rounded-2xl font-extrabold shadow-sm group-hover:shadow-lg transition-all">
              Subscribe
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

function Card({ hub }: { hub: CommunityVM }) {
  const img = getHubImageFromHref(hub.slugHref);

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

          {/* RIGHT THUMB — DP image */}
          <div className="relative w-14 h-14 rounded-2xl overflow-hidden shrink-0 border border-gray-200">
            <Image src={img} alt="" fill className="object-cover" />
            <div className="absolute inset-0 bg-black/10" />
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

function BadgeOnDark({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 text-xs font-semibold px-3 py-1 rounded-full bg-white/15 text-white border border-white/25 backdrop-blur">
      {children}
    </span>
  );
}