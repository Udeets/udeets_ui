import { notFound } from "next/navigation";
import HubRouteClient from "../HubRouteClient";
import { toHubRecord } from "@/lib/hubs";
import { getHubBySlug } from "@/lib/services/hubs/get-hub-by-slug";

export default async function Page({
  params,
}: {
  params: Promise<{ category: string; slug: string }>;
}) {
  const { category, slug } = await params;
  const hub = await getHubBySlug(category, slug);

  if (!hub) {
    notFound();
  }

  return <HubRouteClient initialHub={toHubRecord(hub)} mode="full" />;
}
