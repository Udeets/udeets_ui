"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import HubClient from "./HubClient";
import { getCustomHub, type CustomHubRecord } from "@/lib/custom-hubs";
import type { HubRecord } from "@/lib/hubs";
import { getCurrentSession } from "@/services/auth/getCurrentSession";
import { getHubBySlug } from "@/services/hubs/getHubBySlug";
import type { Hub } from "@/types/hub";

function locationLabelFor(hub: Hub) {
  return [hub.city, hub.state, hub.country].filter(Boolean).join(", ") || "Location coming soon";
}

function toHubRecord(hub: Hub): HubRecord {
  return {
    id: hub.id,
    name: hub.name,
    category: hub.category as HubRecord["category"],
    slug: hub.slug,
    href: `/hubs/${hub.category}/${hub.slug}`,
    locationLabel: locationLabelFor(hub),
    distanceMi: 0,
    membersLabel: "New hub",
    visibility: "Public",
    description: hub.description || "A new uDeets hub is getting set up.",
    tagline: hub.tagline || `${hub.name} on uDeets`,
    intro: hub.description || "This hub was created on uDeets and is ready for its first updates.",
    website: "",
    heroImage: hub.cover_image_url || undefined,
    dpImage: hub.logo_image_url || undefined,
    galleryImages: [],
    feedImages: [],
    adminImages: [],
    tags: [],
    updates: [],
    events: [],
  };
}

export default function HubRouteClient({
  category,
  slug,
  initialHub,
  mode = "intro",
}: {
  category: string;
  slug: string;
  initialHub: HubRecord | null;
  mode?: "intro" | "full";
}) {
  const [resolvedHub, setResolvedHub] = useState<HubRecord | CustomHubRecord | null>(initialHub);
  const [isLoading, setIsLoading] = useState(!initialHub);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (initialHub) {
      setIsLoading(false);
      return;
    }

    let cancelled = false;

    async function resolveHub() {
      setIsLoading(true);
      setLoadError(null);

      const customHub = getCustomHub(category, slug);

      if (customHub) {
        if (!cancelled) {
          setResolvedHub(customHub);
          setIsLoading(false);
        }
        return;
      }

      try {
        const session = await getCurrentSession();
        const userId = session?.user.id;

        if (!userId) {
          throw new Error("You must be signed in to view this hub.");
        }

        const hub = await getHubBySlug(slug);

        if (!hub) {
          if (!cancelled) {
            setResolvedHub(null);
            setLoadError("This hub could not be found.");
          }
          return;
        }

        if (!cancelled) {
          setResolvedHub(toHubRecord(hub));
        }
      } catch (error) {
        if (!cancelled) {
          setResolvedHub(null);
          setLoadError(error instanceof Error ? error.message : "This hub could not be loaded.");
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void resolveHub();

    return () => {
      cancelled = true;
    };
  }, [category, initialHub, slug]);

  if (resolvedHub) {
    return <HubClient hub={resolvedHub} mode={mode} category={category} slug={slug} />;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#E3F1EF] px-4 py-16">
        <div className="mx-auto max-w-xl rounded-3xl border border-slate-100 bg-white p-8 text-center shadow-sm">
          <h1 className="text-2xl font-serif font-semibold tracking-tight text-[#111111]">Loading hub...</h1>
          <p className="mt-3 text-sm leading-relaxed text-slate-600">
            We&apos;re checking local and Supabase-backed hub data for this page.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#E3F1EF] px-4 py-16">
      <div className="mx-auto max-w-xl rounded-3xl border border-slate-100 bg-white p-8 text-center shadow-sm">
        <h1 className="text-2xl font-serif font-semibold tracking-tight text-[#111111]">Hub not found</h1>
        <p className="mt-3 text-sm leading-relaxed text-slate-600">
          {loadError ?? "This hub could not be loaded. It may have been removed from local mock storage."}
        </p>
        <Link
          href="/create-hub"
          className="mt-6 inline-flex rounded-full bg-[#0C5C57] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#094a46]"
        >
          Create a Hub
        </Link>
      </div>
    </div>
  );
}
