import { Suspense } from "react";
import type { Hub as HubRow } from "@/types/hub";
import DiscoverPageContent from "./DiscoverPageContent";

type HubRowWithCount = HubRow & { _memberCount?: number };

async function fetchInitialHubs(): Promise<HubRowWithCount[]> {
  const base = (
    process.env.NEXT_PUBLIC_FASTAPI_BASE_URL ??
    process.env.FASTAPI_BASE_URL ??
    "http://localhost:8000"
  ).replace(/\/$/, "");

  try {
    const res = await fetch(`${base}/api/v1/hubs`, { cache: "no-store" });
    if (!res.ok) return [];
    return (await res.json()) as HubRowWithCount[];
  } catch (error) {
    console.error("[discover] server fetch:", error);
    return [];
  }
}

export default async function DiscoverPage() {
  const initialHubs = await fetchInitialHubs();

  return (
    <Suspense fallback={null}>
      <DiscoverPageContent initialHubs={initialHubs} />
    </Suspense>
  );
}
