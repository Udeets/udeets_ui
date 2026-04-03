/* eslint-disable @next/next/no-img-element */
"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { UdeetsBrandLockup } from "@/components/brand-logo";
import { isUdeetsLogoSrc } from "@/lib/branding";
import { getCurrentSession } from "@/services/auth/getCurrentSession";
import type { Hub as SupabaseHub } from "@/types/hub";

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function normalizePublicSrc(src?: string) {
  if (!src) return "";
  if (src.startsWith("http://") || src.startsWith("https://")) return src;
  if (src.startsWith("/")) return src;
  return `/${src}`;
}

type MappedHub = {
  id: string;
  name: string;
  description: string;
  city: string;
  state: string;
  country: string;
  href: string;
  image: string;
  membersLabel: string;
  locationLabel: string;
};

function toMappedHub(hub: SupabaseHub): MappedHub {
  const imageSrc = hub.dp_image_url || hub.cover_image_url || undefined;
  return {
    id: hub.id,
    name: hub.name,
    description: hub.description || "A new uDeets hub.",
    city: hub.city || "",
    state: hub.state || "",
    country: hub.country || "",
    href: `/hubs/${hub.category}/${hub.slug}`,
    image: normalizePublicSrc(imageSrc),
    membersLabel: "New hub",
    locationLabel: [hub.city, hub.state].filter(Boolean).join(", "),
  };
}

/* ─── Hub list item (reused from discover) ─── */
function HubItem({ hub }: { hub: MappedHub }) {
  const [imageFailed, setImageFailed] = useState(false);
  const isLogo = isUdeetsLogoSrc(hub.image);

  return (
    <Link
      href={hub.href}
      className="flex items-start gap-4 rounded-lg px-2 py-3 transition-colors duration-150 hover:bg-white sm:gap-5 sm:px-3 sm:py-4"
    >
      <div className="h-[72px] w-[72px] flex-shrink-0 overflow-hidden rounded-lg sm:h-[88px] sm:w-[88px]">
        {hub.image && !imageFailed ? (
          <img
            src={hub.image}
            alt={hub.name}
            className={cn("h-full w-full", isLogo ? "object-contain bg-white" : "object-cover")}
            loading="lazy"
            onError={() => setImageFailed(true)}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#0C5C57] to-[#1a8a82]">
            <span className="text-2xl font-semibold text-white/70">{hub.name?.charAt(0)?.toUpperCase()}</span>
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1 pt-0.5">
        <h3 className="truncate text-[15px] font-semibold tracking-tight text-[#111111]">{hub.name}</h3>
        <p className="mt-1 line-clamp-2 text-[13px] leading-snug text-gray-500">{hub.description}</p>
        <div className="mt-2 flex items-center gap-1.5 text-[12px] text-gray-400">
          <span>{hub.membersLabel}</span>
          {hub.locationLabel ? (
            <>
              <span>·</span>
              <span className="truncate">{hub.locationLabel}</span>
            </>
          ) : null}
        </div>
      </div>
    </Link>
  );
}

/* ─── Hub section with title ─── */
function HubSection({ title, hubs, emptyMessage }: { title?: string; hubs: MappedHub[]; emptyMessage?: string }) {
  if (hubs.length === 0 && !emptyMessage) return null;
  return (
    <div className="py-2">
      {title && (
        <h2 className="text-center text-lg font-semibold text-[#111111] py-3">{title}</h2>
      )}
      {hubs.length > 0 ? (
        <div className="grid grid-cols-1 gap-0 divide-y divide-slate-100 md:grid-cols-2 md:gap-x-6 md:divide-y-0">
          {hubs.map((h) => (
            <div key={h.id} className="border-b border-slate-100 last:border-b-0 md:border-b-0">
              <HubItem hub={h} />
            </div>
          ))}
        </div>
      ) : emptyMessage ? (
        <div className="rounded-xl bg-white px-8 py-8 text-center">
          <p className="text-sm text-gray-400">{emptyMessage}</p>
        </div>
      ) : null}
    </div>
  );
}

/* ─── Location change popup ─── */
function LocationChangePopup({
  onSelect,
  onClose,
}: {
  onSelect: (city: string, state: string) => void;
  onClose: () => void;
}) {
  const [input, setInput] = useState("");

  const handleGo = () => {
    const trimmed = input.trim();
    if (!trimmed) return;

    // Try to parse "City, State" or just use as city search
    const parts = trimmed.split(",").map((s) => s.trim());
    const city = parts[0] || "";
    const state = parts[1] || "";
    onSelect(city, state);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[99999] flex items-start justify-center pt-24 sm:pt-32">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-[90%] max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        <h3 className="text-lg font-semibold text-[#111111]">Change location</h3>
        <p className="mt-1 text-sm text-gray-500">Enter a city name or ZIP code</p>

        <div className="mt-4 flex items-center gap-2">
          <input
            autoFocus
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleGo()}
            placeholder="e.g. Pottstown, PA or 23116"
            className="flex-1 rounded-lg border border-slate-200 bg-[#fafafa] px-4 py-2.5 text-sm text-[#111111] outline-none placeholder:text-gray-400 focus:border-[#0C5C57] focus:ring-1 focus:ring-[#0C5C57]"
          />
          <button
            onClick={handleGo}
            className="rounded-lg bg-gradient-to-r from-[#0C5C57] to-[#1a8a82] px-4 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90"
          >
            Go
          </button>
        </div>

        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-gray-400 hover:text-gray-600"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}

type GeoState = "asking" | "loading" | "resolved" | "denied" | "manual";

export default function LocationDiscoverPage() {
  const [geoState, setGeoState] = useState<GeoState>("asking");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [allHubs, setAllHubs] = useState<MappedHub[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showChangePopup, setShowChangePopup] = useState(false);

  // Fetch all hubs
  useEffect(() => {
    let cancelled = false;
    async function fetchHubs() {
      try {
        const session = await getCurrentSession();
        if (!cancelled) setIsAuthenticated(Boolean(session));

        const { createClient } = await import("@/lib/supabase/client");
        const supabase = createClient();

        const query = session
          ? supabase.from("hubs").select("*").neq("created_by", session.user.id).order("created_at", { ascending: false })
          : supabase.from("hubs").select("*").order("created_at", { ascending: false });

        const { data } = await query;
        if (!cancelled && data) {
          setAllHubs(data.map(toMappedHub));
        }
      } catch {
        // Silent fallback
      }
      if (!cancelled) setLoading(false);
    }
    void fetchHubs();
    return () => { cancelled = true; };
  }, []);

  // Request geolocation on "Allow" click
  const requestGeolocation = () => {
    if (!navigator.geolocation) {
      setGeoState("manual");
      return;
    }
    setGeoState("loading");
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&zoom=10`
          );
          if (res.ok) {
            const data = await res.json();
            const c = data.address?.city || data.address?.town || data.address?.village || data.address?.county || "";
            const s = data.address?.state || "";
            setCity(c);
            setState(s);
            setGeoState("resolved");
            return;
          }
        } catch {
          // fallback
        }
        setGeoState("manual");
      },
      () => {
        setGeoState("denied");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleManualEntry = () => {
    setShowChangePopup(true);
  };

  const handleLocationChange = (newCity: string, newState: string) => {
    setCity(newCity);
    setState(newState);
    setGeoState("resolved");
  };

  // Filter hubs by location
  const cityLower = city.toLowerCase();
  const stateLower = state.toLowerCase();

  const cityHubs = useMemo(
    () => cityLower ? allHubs.filter((h) => h.city.toLowerCase().includes(cityLower)) : [],
    [allHubs, cityLower]
  );

  const stateHubs = useMemo(
    () => stateLower
      ? allHubs.filter((h) => h.state.toLowerCase().includes(stateLower) && !cityHubs.some((ch) => ch.id === h.id))
      : [],
    [allHubs, stateLower, cityHubs]
  );

  const globalHubs = useMemo(
    () => allHubs.filter((h) => !cityHubs.some((ch) => ch.id === h.id) && !stateHubs.some((sh) => sh.id === h.id)),
    [allHubs, cityHubs, stateHubs]
  );

  const locationLabel = [city, state].filter(Boolean).join(", ") || "Your Area";

  return (
    <div className="min-h-screen bg-[#fafafa]">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-slate-200/60">
        <div className="flex min-h-14 w-full items-center justify-between px-4 py-2 sm:px-6 lg:px-10">
          <Link href="/discover" className="flex items-center gap-2">
            <svg viewBox="0 0 24 24" className="h-5 w-5 text-gray-500" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 18l-6-6 6-6" />
            </svg>
            <span className="text-sm font-medium text-gray-500">Discover</span>
          </Link>
          <Link href="/" className="flex min-w-0 items-center gap-2 sm:gap-3">
            <UdeetsBrandLockup textClassName="text-xl sm:text-2xl" priority />
          </Link>
          <div className="flex items-center gap-2">
            <Link
              href={isAuthenticated ? "/dashboard" : "/"}
              className="flex h-9 w-9 items-center justify-center rounded-full text-gray-500 transition hover:bg-slate-100 hover:text-[#111111]"
              aria-label="Home"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5Z" />
                <path d="M9 21V12h6v9" />
              </svg>
            </Link>
          </div>
        </div>
      </header>

      {/* ─── Location permission prompt ─── */}
      {geoState === "asking" && (
        <div className="mx-auto max-w-md px-4 py-20 text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#0C5C57] to-[#1a8a82]">
            <svg viewBox="0 0 24 24" className="h-8 w-8 text-white" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 22s7-6.2 7-12A7 7 0 1 0 5 10c0 5.8 7 12 7 12Z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-[#111111]">Find hubs near you</h2>
          <p className="mt-2 text-sm text-gray-500">
            Allow uDeets to use your location to show hubs in your city and state.
          </p>
          <div className="mt-8 flex flex-col items-center gap-3">
            <button
              onClick={requestGeolocation}
              className="w-full max-w-xs rounded-full bg-gradient-to-r from-[#0C5C57] to-[#1a8a82] px-6 py-3 text-sm font-medium text-white transition hover:opacity-90"
            >
              Allow location access
            </button>
            <button
              onClick={handleManualEntry}
              className="text-sm font-medium text-gray-500 transition hover:text-[#111111]"
            >
              Enter location manually
            </button>
          </div>
        </div>
      )}

      {/* ─── Loading geolocation ─── */}
      {geoState === "loading" && (
        <div className="mx-auto max-w-md px-4 py-20 text-center">
          <svg className="mx-auto h-10 w-10 animate-spin text-[#0C5C57]" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.25" />
            <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
          </svg>
          <p className="mt-4 text-sm text-gray-500">Finding your location...</p>
        </div>
      )}

      {/* ─── Location denied ─── */}
      {geoState === "denied" && (
        <div className="mx-auto max-w-md px-4 py-20 text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100">
            <svg viewBox="0 0 24 24" className="h-8 w-8 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 22s7-6.2 7-12A7 7 0 1 0 5 10c0 5.8 7 12 7 12Z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-[#111111]">Location access denied</h2>
          <p className="mt-2 text-sm text-gray-500">
            You can still browse hubs by entering your city or ZIP code.
          </p>
          <button
            onClick={handleManualEntry}
            className="mt-6 rounded-full bg-gradient-to-r from-[#0C5C57] to-[#1a8a82] px-6 py-3 text-sm font-medium text-white transition hover:opacity-90"
          >
            Enter location manually
          </button>
        </div>
      )}

      {/* ─── Manual entry prompt (no popup yet, just show popup) ─── */}
      {geoState === "manual" && !city && (
        <div className="mx-auto max-w-md px-4 py-20 text-center">
          <h2 className="text-xl font-semibold text-[#111111]">Where are you looking?</h2>
          <p className="mt-2 text-sm text-gray-500">Enter a city name or ZIP code to find nearby hubs.</p>
          <button
            onClick={() => setShowChangePopup(true)}
            className="mt-6 rounded-full bg-gradient-to-r from-[#0C5C57] to-[#1a8a82] px-6 py-3 text-sm font-medium text-white transition hover:opacity-90"
          >
            Enter your location
          </button>
        </div>
      )}

      {/* ─── Location resolved → show hub sections ─── */}
      {geoState === "resolved" && (
        <div className="mx-auto max-w-4xl px-4 py-4 sm:px-6 lg:px-10">
          {/* City, State header with dropdown */}
          <button
            onClick={() => setShowChangePopup(true)}
            className="mx-auto mt-4 mb-2 flex items-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-2.5 text-base font-semibold text-[#111111] shadow-sm transition hover:bg-slate-50"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4 text-[#0C5C57]" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 22s7-6.2 7-12A7 7 0 1 0 5 10c0 5.8 7 12 7 12Z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
            {locationLabel}
            <svg viewBox="0 0 24 24" className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 9l6 6 6-6" />
            </svg>
          </button>

          {loading ? (
            <div className="py-12 text-center">
              <p className="text-sm text-gray-400">Loading hubs...</p>
            </div>
          ) : (
            <>
              {/* City hubs */}
              {city && (
                <HubSection
                  hubs={cityHubs}
                  emptyMessage={`No hubs in ${city} yet`}
                />
              )}

              {/* Didn't find your hub? */}
              <div className="my-4 flex items-center justify-center gap-3 rounded-xl bg-white border border-slate-100 px-5 py-4">
                <span className="text-sm text-gray-500">Didn&apos;t find the right hub?</span>
                <Link
                  href={isAuthenticated ? "/create-hub" : "/auth"}
                  className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-[#0C5C57] to-[#1a8a82] px-4 py-2 text-sm font-medium text-white transition hover:opacity-90"
                >
                  <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                  Create One
                </Link>
              </div>

              {/* State hubs */}
              {state && (
                <HubSection
                  title={state}
                  hubs={stateHubs}
                  emptyMessage={`No other hubs in ${state} yet`}
                />
              )}

              {/* Global hubs */}
              {globalHubs.length > 0 && (
                <HubSection
                  title="Global"
                  hubs={globalHubs}
                />
              )}
            </>
          )}
        </div>
      )}

      {/* Location change popup */}
      {showChangePopup && (
        <LocationChangePopup
          onSelect={handleLocationChange}
          onClose={() => setShowChangePopup(false)}
        />
      )}

      <footer className="border-t border-slate-100 bg-white py-6 mt-8">
        <div className="mx-auto max-w-4xl px-4 text-xs text-gray-400 sm:px-6 lg:px-10">
          uDeets © {new Date().getFullYear()}
        </div>
      </footer>
    </div>
  );
}
