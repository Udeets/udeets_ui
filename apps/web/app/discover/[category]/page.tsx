import { notFound } from "next/navigation";
import ReligiousView, { HubFromApi as ReligiousHubFromApi } from "../_views/ReligiousView";
import RestaurantsView, { HubFromApi as RestaurantsHubFromApi } from "../_views/RestaurantsView";
import CommunitiesView, { HubFromApi as CommunitiesHubFromApi } from "../_views/CommunitiesView";

type HubCategory = "religious" | "restaurants" | "communities";

export default async function DiscoverCategoryPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category } = await params;

  if (!["religious", "restaurants", "communities"].includes(category)) {
    notFound();
  }

  const typed = category as HubCategory;

  const base =
    process.env.NEXT_PUBLIC_API_BASE_URL?.trim() || "http://localhost:3002";

  const res = await fetch(`${base}/hubs?category=${typed}`, { cache: "no-store" });
  if (!res.ok) notFound();

  const hubs = await res.json();

  if (typed === "religious") {
    return <ReligiousView hubs={hubs as ReligiousHubFromApi[]} />;
  }
  if (typed === "restaurants") {
    return <RestaurantsView hubs={hubs as RestaurantsHubFromApi[]} />;
  }
  return <CommunitiesView hubs={hubs as CommunitiesHubFromApi[]} />;
}