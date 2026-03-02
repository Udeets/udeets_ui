// apps/web/app/discover/page.tsx
"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type FilterCard = {
  title: string;
  desc: string;
  icon: "temple" | "users" | "utensils" | "home" | "dumbbell" | "paw";
  iconBg: string;
  href: string;
};

const FILTERS: FilterCard[] = [
  {
    title: "Religious Places",
    desc: "Discover temples, churches, and spiritual centers in your area",
    icon: "temple",
    iconBg: "bg-gradient-to-br from-orange-400 to-pink-500",
    href: "/discover/religious",
  },
  {
    title: "Communities",
    desc: "Connect with local groups and community organizations",
    icon: "users",
    iconBg: "bg-gradient-to-br from-blue-400 to-indigo-500",
    href: "/discover/communities",
  },
  {
    title: "Restaurants",
    desc: "Find the best local dining experiences and food communities",
    icon: "utensils",
    iconBg: "bg-gradient-to-br from-green-400 to-emerald-500",
    href: "/discover/restaurants",
  },
  {
    title: "HOA's",
    desc: "Join homeowner associations and neighborhood groups",
    icon: "home",
    iconBg: "bg-gradient-to-br from-purple-400 to-fuchsia-500",
    href: "/auth",
  },
  {
    title: "Fitness Clubs",
    desc: "Discover gyms, yoga studios, and fitness communities",
    icon: "dumbbell",
    iconBg: "bg-gradient-to-br from-red-400 to-rose-500",
    href: "/auth",
  },
  {
    title: "Pet Clubs",
    desc: "Connect with fellow pet lovers and animal communities",
    icon: "paw",
    iconBg: "bg-gradient-to-br from-yellow-400 to-amber-500",
    href: "/auth",
  },
];

// Inline SVG icons (no FontAwesome dependency)
function IconTemple(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path d="M12 3 6 6.5v2L12 6l6 2.5v-2L12 3Z" fill="currentColor" />
      <path d="M6 10h12v2H6v-2Z" fill="currentColor" />
      <path d="M7 12h10v7H7v-7Z" fill="currentColor" opacity="0.95" />
      <path d="M5 19h14v2H5v-2Z" fill="currentColor" />
    </svg>
  );
}
function IconUsers(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path d="M16 11a3 3 0 1 0-3-3 3 3 0 0 0 3 3Z" fill="currentColor" />
      <path
        d="M8.5 11.5a2.5 2.5 0 1 0-2.5-2.5 2.5 2.5 0 0 0 2.5 2.5Z"
        fill="currentColor"
        opacity="0.95"
      />
      <path
        d="M16 13c-2.8 0-5 1.4-5 3.2V18h10v-1.8C21 14.4 18.8 13 16 13Z"
        fill="currentColor"
      />
      <path
        d="M8.5 13.5c-2.5 0-4.5 1.2-4.5 2.8V18h7v-1.7c0-.9.3-1.7.9-2.3-.9-.3-1.9-.5-3.4-.5Z"
        fill="currentColor"
        opacity="0.9"
      />
    </svg>
  );
}
function IconUtensils(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path d="M6 2h2v8a2 2 0 0 1-2 2H5V2h1Z" fill="currentColor" />
      <path d="M10 2h2v20h-2V2Z" fill="currentColor" opacity="0.95" />
      <path
        d="M16 2c2 0 3 2 3 4v6h-2V6c0-1.2-.4-2-1-2s-1 .8-1 2v6h-2V6c0-2 1-4 3-4Z"
        fill="currentColor"
      />
      <path d="M19 12v10h-2V12h2Z" fill="currentColor" opacity="0.95" />
    </svg>
  );
}
function IconHome(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path d="M12 3 3 10v11h6v-6h6v6h6V10l-9-7Z" fill="currentColor" />
    </svg>
  );
}
function IconDumbbell(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path d="M2 10h3v4H2v-4Z" fill="currentColor" />
      <path d="M5 9h2v6H5V9Z" fill="currentColor" opacity="0.9" />
      <path d="M17 9h2v6h-2V9Z" fill="currentColor" opacity="0.9" />
      <path d="M19 10h3v4h-3v-4Z" fill="currentColor" />
      <path d="M7 11h10v2H7v-2Z" fill="currentColor" opacity="0.95" />
    </svg>
  );
}
function IconPaw(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path d="M7.5 12.2a2 2 0 1 0-2-2 2 2 0 0 0 2 2Z" fill="currentColor" />
      <path d="M16.5 12.2a2 2 0 1 0-2-2 2 2 0 0 0 2 2Z" fill="currentColor" />
      <path
        d="M12 11a2 2 0 1 0-2-2 2 2 0 0 0 2 2Z"
        fill="currentColor"
        opacity="0.95"
      />
      <path
        d="M12 13c-3.3 0-6 2-6 4.5 0 1.4 1.1 2.5 2.6 2.5 1.1 0 2.2-.5 3.4-.5s2.3.5 3.4.5c1.5 0 2.6-1.1 2.6-2.5C18 15 15.3 13 12 13Z"
        fill="currentColor"
      />
    </svg>
  );
}

function FilterIcon({ kind }: { kind: FilterCard["icon"] }) {
  const common = { className: "h-9 w-9 text-white" };
  switch (kind) {
    case "temple":
      return <IconTemple {...common} />;
    case "users":
      return <IconUsers {...common} />;
    case "utensils":
      return <IconUtensils {...common} />;
    case "home":
      return <IconHome {...common} />;
    case "dumbbell":
      return <IconDumbbell {...common} />;
    case "paw":
      return <IconPaw {...common} />;
  }
}

export default function DiscoverPage() {
  const router = useRouter();
  const carouselRef = useRef<HTMLDivElement | null>(null);
  const [pageIndex, setPageIndex] = useState(0);

  const cardsPerView = 3;
  const maxIndex = Math.max(0, Math.ceil(FILTERS.length / cardsPerView) - 1);

  const scrollToIndex = (idx: number) => {
    const el = carouselRef.current;
    if (!el) return;

    const next = Math.min(Math.max(idx, 0), maxIndex);
    setPageIndex(next);
    el.scrollTo({ left: el.clientWidth * next, behavior: "smooth" });
  };

  useEffect(() => {
    const onResize = () => {
      const el = carouselRef.current;
      if (!el) return;
      el.scrollTo({ left: el.clientWidth * pageIndex, behavior: "auto" });
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [pageIndex]);

  return (
    <div className="min-h-screen bg-white">
      {/* TOP STRIP — updated to new light brand gradient */}
      <header className="bg-gradient-to-br from-teal-500 to-cyan-500">
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

            <Link
              href="/"
              className="text-white font-semibold px-6 py-2.5 rounded-2xl hover:bg-white/10 transition-all duration-300"
            >
              Home
            </Link>
          </div>
        </div>
      </header>

      {/* HERO — updated to new light brand gradient */}
      <section className="relative overflow-hidden bg-gradient-to-br from-teal-500 via-cyan-500 to-blue-500">
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="absolute -top-24 -left-24 w-[320px] h-[320px] bg-white rounded-full blur-3xl" />
          <div className="absolute -bottom-32 -right-32 w-[420px] h-[420px] bg-white rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-4xl mx-auto px-6 lg:px-8 text-center py-20 sm:py-24">
          <h1 className="text-white text-5xl sm:text-6xl lg:text-7xl font-extrabold mb-6">
            Discover Hubs
          </h1>

          <p className="text-white/90 text-lg sm:text-xl mb-10 max-w-2xl mx-auto">
            Explore temples, communities and restaurants near you.
          </p>

          {/* Button INSIDE input — button gradient updated too */}
          <div className="max-w-2xl mx-auto">
            <div className="relative">
              <input
                type="text"
                placeholder="Search for hubs, places, or communities…"
                className="w-full px-6 py-5 rounded-2xl bg-white shadow-xl text-gray-800 text-lg placeholder-gray-500 focus:outline-none focus:ring-4 focus:ring-white/30 transition-all duration-300 pr-[160px]"
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 bg-gradient-to-br from-teal-500 via-cyan-500 to-blue-500 text-white px-7 py-3.5 rounded-xl font-extrabold shadow-xl hover:scale-105 transition-transform duration-300"
              >
                Search
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* FILTERS */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-4xl sm:text-5xl font-extrabold text-gray-900 mb-4">
              Explore by Category
            </h2>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
              Browse through our curated categories to find the perfect hub for you
            </p>
          </div>

          <div className="relative pl-20 pr-20">
            <div
              ref={carouselRef}
              className="flex gap-6 overflow-x-auto pb-4 snap-x snap-mandatory lg:overflow-hidden"
              style={{ scrollBehavior: "smooth" }}
            >
              {FILTERS.map((f) => (
                <div
                  key={f.title}
                  className="min-w-full sm:min-w-[calc(50%-12px)] lg:min-w-[calc(33.333%-16px)] snap-center"
                >
                  <button
                    type="button"
                    onClick={() => router.push(f.href)}
                    className="w-full text-left"
                    aria-label={`Go to ${f.title}`}
                  >
                    <div className="bg-white border border-gray-200 rounded-3xl p-8 shadow-sm hover:shadow-xl hover:-translate-y-2 hover:border-gray-300 transition-all duration-300 h-full">
                      <div
                        className={`${f.iconBg} w-20 h-20 rounded-2xl flex items-center justify-center mb-6`}
                      >
                        <FilterIcon kind={f.icon} />
                      </div>

                      <h3 className="text-2xl font-extrabold text-gray-900 mb-3">
                        {f.title}
                      </h3>
                      <p className="text-gray-600">{f.desc}</p>
                    </div>
                  </button>
                </div>
              ))}
            </div>

            {/* LEFT ARROW */}
            <button
              aria-label="Scroll left"
              onClick={() => scrollToIndex(pageIndex - 1)}
              className={`hidden lg:flex absolute left-0 top-1/2 -translate-y-1/2 bg-white w-14 h-14 rounded-full shadow-xl items-center justify-center hover:scale-110 transition-all duration-300 border-2 border-gray-200 hover:border-teal-500 z-10 ${
                pageIndex <= 0 ? "opacity-0 pointer-events-none" : ""
              }`}
            >
              <span className="text-teal-500 text-xl font-bold">←</span>
            </button>

            {/* RIGHT ARROW */}
            <button
              aria-label="Scroll right"
              onClick={() => scrollToIndex(pageIndex + 1)}
              className={`hidden lg:flex absolute right-0 top-1/2 -translate-y-1/2 bg-white w-14 h-14 rounded-full shadow-xl items-center justify-center hover:scale-110 transition-all duration-300 border-2 border-gray-200 hover:border-teal-500 z-10 ${
                pageIndex >= maxIndex ? "opacity-0 pointer-events-none" : ""
              }`}
            >
              <span className="text-teal-500 text-xl font-bold">→</span>
            </button>
          </div>
        </div>
      </section>

      {/* CTA — updated to new light brand gradient */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="bg-gradient-to-br from-teal-500 via-cyan-500 to-blue-500 rounded-3xl p-12 sm:p-16 lg:p-20 text-center relative overflow-hidden">
            <div className="absolute inset-0 opacity-10 pointer-events-none">
              <div className="absolute -top-24 -left-24 w-[320px] h-[320px] bg-white rounded-full blur-3xl" />
              <div className="absolute -bottom-32 -right-32 w-[420px] h-[420px] bg-white rounded-full blur-3xl" />
            </div>

            <div className="relative">
              <h2 className="text-white text-4xl sm:text-5xl font-extrabold mb-6">
                Start Your Own Hub
              </h2>
              <p className="text-white/90 text-lg sm:text-xl mb-10 max-w-2xl mx-auto">
                Create a space for your community, business, or organization and
                connect with people who share your interests.
              </p>

              <Link
                href="/auth"
                className="inline-flex items-center justify-center bg-white text-teal-700 px-10 py-4 rounded-2xl font-extrabold text-lg hover:scale-105 hover:shadow-2xl transition-all duration-300"
              >
                Create Your Hub
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER — updated */}
      <footer className="bg-gradient-to-br from-teal-500 to-cyan-500">
        <div className="w-full px-4 sm:px-6 lg:px-10">
          <div className="h-16 flex items-center justify-center text-white/90 text-sm">
            © uDeets. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}