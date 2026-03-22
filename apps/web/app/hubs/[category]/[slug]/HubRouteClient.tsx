"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import HubClient from "./HubClient";
import { getCustomHub, type CustomHubRecord } from "@/lib/custom-hubs";
import type { HubRecord } from "@/lib/hubs";

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
  const [checkedCustomHub, setCheckedCustomHub] = useState(Boolean(initialHub));

  useEffect(() => {
    if (initialHub) return;

    const customHub = getCustomHub(category, slug);
    setResolvedHub(customHub);
    setCheckedCustomHub(true);
  }, [category, initialHub, slug]);

  if (resolvedHub) {
    return <HubClient hub={resolvedHub} mode={mode} category={category} slug={slug} />;
  }

  if (!checkedCustomHub) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#E3F1EF] px-4 py-16">
      <div className="mx-auto max-w-xl rounded-3xl border border-slate-100 bg-white p-8 text-center shadow-sm">
        <h1 className="text-2xl font-serif font-semibold tracking-tight text-[#111111]">Hub not found</h1>
        <p className="mt-3 text-sm leading-relaxed text-slate-600">
          This hub could not be loaded. It may have been removed from local mock storage.
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
