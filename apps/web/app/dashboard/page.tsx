// apps/web/app/dashboard/page.tsx
import Image from "next/image";
import Link from "next/link";

type HubCategory = "religious" | "restaurants" | "communities";

type FeedItem = {
  id: string;
  hubSlug: string;
  hubName: string;
  category: HubCategory;
  type: "image" | "event" | "deal";
  title: string;
  body?: string;
  imageUrl?: string;
  createdAt: string;
};

const GRADIENT = "bg-gradient-to-br from-teal-600 via-cyan-700 to-blue-800";

function categoryToDiscoverPath(category: HubCategory) {
  if (category === "religious") return "/discover/religious";
  if (category === "restaurants") return "/discover/restaurants";
  return "/discover/communities";
}

function categoryToHubPrefix(category: HubCategory) {
  // matches your folder structure under /app/hubs/<category-namespace>/<slug>
  if (category === "religious") return "/hubs/religious-places";
  if (category === "restaurants") return "/hubs/restaurants";
  return "/hubs/communities";
}

function timeAgo(iso: string) {
  const then = new Date(iso).getTime();
  const now = Date.now();
  const diff = Math.max(0, now - then);

  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m`;

  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;

  const days = Math.floor(hrs / 24);
  return `${days}d`;
}

export default async function DashboardPage() {
  const base = process.env.NEXT_PUBLIC_API_BASE_URL?.trim() || "http://localhost:3002";

  let feed: FeedItem[] = [];
  try {
    const res = await fetch(`${base}/feed`, { cache: "no-store" });
    if (res.ok) feed = (await res.json()) as FeedItem[];
  } catch {
    // ignore (we’ll show empty state)
  }

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

        <div className="relative max-w-7xl mx-auto px-6 lg:px-8 py-14">
          <h1 className="text-white text-4xl sm:text-5xl font-extrabold">
            Dashboard
          </h1>
          <p className="text-white/90 mt-3 max-w-2xl">
            Your personalized feed from the hubs you follow. Discover new hubs and create your own.
          </p>

          {/* ACTION ROW */}
          <div className="mt-10 grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Discover Hubs */}
            <div className="lg:col-span-8 rounded-3xl bg-white/10 border border-white/15 p-6 sm:p-7 backdrop-blur">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="text-white font-extrabold text-xl">
                    Discover Hubs
                  </div>
                  <div className="text-white/85 text-sm mt-1">
                    Jump into categories and find what matters near you.
                  </div>
                </div>
                <Link
                  href="/discover"
                  className="inline-flex items-center justify-center bg-white text-teal-700 px-5 py-3 rounded-2xl font-extrabold hover:opacity-95 transition"
                >
                  Explore
                </Link>
              </div>

              <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Link
                  href="/discover/religious"
                  className="rounded-2xl bg-white/10 border border-white/15 px-4 py-4 hover:bg-white/15 transition"
                >
                  <div className="text-white font-extrabold">Religious</div>
                  <div className="text-white/80 text-sm mt-1">
                    Temples, churches & more
                  </div>
                </Link>

                <Link
                  href="/discover/communities"
                  className="rounded-2xl bg-white/10 border border-white/15 px-4 py-4 hover:bg-white/15 transition"
                >
                  <div className="text-white font-extrabold">Communities</div>
                  <div className="text-white/80 text-sm mt-1">
                    Groups & associations
                  </div>
                </Link>

                <Link
                  href="/discover/restaurants"
                  className="rounded-2xl bg-white/10 border border-white/15 px-4 py-4 hover:bg-white/15 transition"
                >
                  <div className="text-white font-extrabold">Restaurants</div>
                  <div className="text-white/80 text-sm mt-1">
                    Deals & local favorites
                  </div>
                </Link>
              </div>
            </div>

            {/* Create Hub */}
            <div className="lg:col-span-4 rounded-3xl bg-white p-6 sm:p-7 shadow-sm border border-gray-200">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-gray-900 font-extrabold text-xl">
                    Create your Hub
                  </div>
                  <div className="text-gray-600 text-sm mt-1">
                    Build a space for your community or business.
                  </div>
                </div>

                <div className="w-14 h-14 rounded-2xl bg-gray-100 border border-gray-200 flex items-center justify-center">
                  <span className="text-3xl font-black text-gray-500">+</span>
                </div>
              </div>

              <Link
                href="/auth"
                className="mt-6 inline-flex w-full items-center justify-center bg-gradient-to-br from-teal-600 to-cyan-700 text-white px-5 py-3 rounded-2xl font-extrabold hover:opacity-95 transition"
              >
                Start
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* FEED */}
      <section className="bg-white">
        <div className="max-w-3xl mx-auto px-6 lg:px-8 py-12">
          <div className="flex items-end justify-between gap-6 mb-8">
            <div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900">
                Public Feed
              </h2>
              <p className="text-gray-600 mt-2">
                Mock updates from your public hubs.
              </p>
            </div>

            <div className="text-sm text-gray-500">
              Source:{" "}
              <span className="font-semibold text-gray-900">{base}/feed</span>
            </div>
          </div>

          {feed.length === 0 ? (
            <div className="rounded-3xl border border-gray-200 p-8 text-gray-700">
              No feed items yet. (Tip: make sure API is running on {base})
            </div>
          ) : (
            <div className="space-y-6">
              {feed.map((item) => (
                <FeedCard key={item.id} item={item} />
              ))}
            </div>
          )}
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

function FeedCard({ item }: { item: FeedItem }) {
  const hubHref = `${categoryToHubPrefix(item.category)}/${item.hubSlug}`;
  const discoverHref = categoryToDiscoverPath(item.category);

  return (
    <article className="rounded-3xl border border-gray-200 bg-white shadow-sm overflow-hidden">
      {/* Header */}
      <div className="p-5 sm:p-6 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Link
              href={hubHref}
              className="font-extrabold text-gray-900 hover:text-teal-700 transition-colors truncate"
              title={item.hubName}
            >
              {item.hubName}
            </Link>
            <span className="text-gray-300">•</span>
            <Link
              href={discoverHref}
              className="text-xs font-semibold text-teal-700 bg-teal-50 border border-teal-100 px-2.5 py-1 rounded-full hover:bg-teal-100 transition"
            >
              {item.category}
            </Link>
          </div>

          <div className="text-sm text-gray-500 mt-1">
            {timeAgo(item.createdAt)} • {item.type.toUpperCase()}
          </div>
        </div>

        <Link
          href={hubHref}
          className="shrink-0 text-sm font-extrabold text-white bg-gradient-to-br from-teal-600 to-cyan-700 px-4 py-2 rounded-2xl hover:opacity-95 transition"
        >
          View Hub
        </Link>
      </div>

      {/* Body */}
      {item.type === "image" ? (
        <div className="relative h-[320px] bg-gray-100">
          {/* If you later add real images in apps/web/public/mock/... this will render */}
          {item.imageUrl ? (
            <Image
              src={item.imageUrl}
              alt={item.title}
              fill
              className="object-cover"
            />
          ) : null}

          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent" />
          <div className="absolute left-6 bottom-5 right-6">
            <div className="text-white font-extrabold text-lg">{item.title}</div>
            {item.body ? (
              <div className="text-white/90 text-sm mt-1">{item.body}</div>
            ) : null}
          </div>
        </div>
      ) : (
        <div className="px-6 pb-6">
          <div className="rounded-2xl border border-gray-200 bg-gray-50 p-5">
            <div className="flex items-center gap-2">
              <span className="text-xl">
                {item.type === "event" ? "📅" : "🏷️"}
              </span>
              <div className="font-extrabold text-gray-900">{item.title}</div>
            </div>
            {item.body ? (
              <div className="text-gray-600 mt-2">{item.body}</div>
            ) : null}
          </div>
        </div>
      )}

      {/* Footer actions */}
      <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
        <div className="text-sm text-gray-500">
          Mock reactions (v0)
        </div>
        <div className="flex items-center gap-2">
          <button className="px-4 py-2 rounded-2xl bg-gray-100 text-gray-800 font-semibold hover:bg-gray-200 transition">
            Like
          </button>
          <button className="px-4 py-2 rounded-2xl bg-gray-100 text-gray-800 font-semibold hover:bg-gray-200 transition">
            Comment
          </button>
          <button className="px-4 py-2 rounded-2xl bg-gray-100 text-gray-800 font-semibold hover:bg-gray-200 transition">
            Share
          </button>
        </div>
      </div>
    </article>
  );
}