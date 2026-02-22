import Link from "next/link";

const categories = [
  { label: "Religious Places", href: "/hub" },
  { label: "Communities", href: "/hub" },
  { label: "Restaurants", href: "/hub" },
  { label: "Events", href: "/hub" },
  { label: "Deals", href: "/hub" },
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-white text-neutral-900">
      {/* Top strip */}
      <div className="border-b border-neutral-200">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-xl bg-neutral-900" />
            <span className="text-sm font-semibold tracking-tight">uDeets</span>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/hub"
              className="rounded-xl border border-neutral-200 px-3 py-2 text-sm hover:bg-neutral-50"
            >
              Explore
            </Link>
            <Link
              href="/auth"
              className="rounded-xl bg-neutral-900 px-3 py-2 text-sm font-medium text-white hover:bg-neutral-800"
            >
              Login / Sign up
            </Link>
          </div>
        </div>
      </div>

      {/* Center section */}
      <div className="mx-auto max-w-5xl px-4 py-10 pb-40">
        <div className="grid gap-8 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="text-sm text-neutral-500">The Local Community Hub</p>
            <h1 className="mt-2 text-4xl font-semibold tracking-tight">
              Discover what’s happening around you.
            </h1>
            <p className="mt-4 text-neutral-600">
              uDeets brings together religious places, communities, and local
              businesses into one simple feed — updates, events, and deals.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/auth"
                className="rounded-xl bg-neutral-900 px-5 py-3 text-sm font-medium text-white hover:bg-neutral-800"
              >
                Get started
              </Link>
              <Link
                href="/hub"
                className="rounded-xl border border-neutral-200 px-5 py-3 text-sm font-medium hover:bg-neutral-50"
              >
                Browse hubs
              </Link>
              <Link
                href="/dashboard"
                className="rounded-xl border border-neutral-200 px-5 py-3 text-sm font-medium hover:bg-neutral-50"
              >
                Go to dashboard
              </Link>
            </div>

            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-neutral-200 p-4 shadow-sm">
                <p className="text-sm font-medium">Simple</p>
                <p className="mt-1 text-sm text-neutral-600">
                  Clean, minimal hub pages.
                </p>
              </div>
              <div className="rounded-2xl border border-neutral-200 p-4 shadow-sm">
                <p className="text-sm font-medium">Local</p>
                <p className="mt-1 text-sm text-neutral-600">
                  Communities & places you care about.
                </p>
              </div>
              <div className="rounded-2xl border border-neutral-200 p-4 shadow-sm">
                <p className="text-sm font-medium">Updates</p>
                <p className="mt-1 text-sm text-neutral-600">
                  Events, deals, and photos (mock v0).
                </p>
              </div>
            </div>
          </div>

          {/* Right-side mock preview */}
          <div className="rounded-2xl border border-neutral-200 p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">Preview</p>
              <p className="text-xs text-neutral-500">Mock</p>
            </div>

            <div className="mt-4 overflow-hidden rounded-2xl border border-neutral-200">
              <div className="h-48 w-full bg-neutral-100" />
              <div className="p-4">
                <p className="text-xs text-neutral-500">Public Feed</p>
                <p className="mt-1 text-sm font-medium">
                  One update from each hub
                </p>
                <p className="mt-1 text-sm text-neutral-600">
                  Photos + events + deals — all in one place.
                </p>
              </div>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-neutral-200 p-4">
                <p className="text-xs text-neutral-500">Religious Places</p>
                <p className="mt-1 text-sm font-medium">Temple updates</p>
              </div>
              <div className="rounded-xl border border-neutral-200 p-4">
                <p className="text-xs text-neutral-500">Communities</p>
                <p className="mt-1 text-sm font-medium">Meetups & programs</p>
              </div>
              <div className="rounded-xl border border-neutral-200 p-4">
                <p className="text-xs text-neutral-500">Restaurants</p>
                <p className="mt-1 text-sm font-medium">Deals & specials</p>
              </div>
              <div className="rounded-xl border border-neutral-200 p-4">
                <p className="text-xs text-neutral-500">Discover</p>
                <p className="mt-1 text-sm font-medium">Filters + browse</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Fixed bottom strip (double height) */}
      <div className="fixed bottom-0 left-0 right-0 border-t border-neutral-200 bg-white">
        <div className="mx-auto max-w-5xl px-4 py-6">
          <div className="flex flex-wrap items-center gap-2">
            {categories.map((c) => (
              <Link
                key={c.label}
                href={c.href}
                className="rounded-full border border-neutral-200 px-4 py-2 text-sm hover:bg-neutral-50"
              >
                {c.label}
              </Link>
            ))}
          </div>

          <div className="mt-5 flex items-center justify-between text-xs text-neutral-500">
            <span>© 2026 uDeets</span>
            <span>Built for local community hubs</span>
          </div>
        </div>
      </div>
    </main>
  );
}
