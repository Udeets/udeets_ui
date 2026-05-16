import { notFound } from "next/navigation";
import { toHubRecord } from "@/lib/hubs";
import { getHubBySlug } from "@/lib/services/hubs/get-hub-by-slug";
import HubRouteClient from "../HubRouteClient";

export const dynamic = "force-dynamic";

export default async function HubJoinPage({
  params,
}: {
  params: Promise<{ category: string; slug: string }>;
}) {
  const { category, slug } = await params;
  const hub = await getHubBySlug(category, slug);

  if (!hub) {
    notFound();
  }

  return <HubRouteClient initialHub={toHubRecord(hub)} />;
}
