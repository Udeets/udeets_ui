import { Suspense } from "react";
import HubRouteClient from "../HubRouteClient";
import { getHub } from "@/lib/hubs";

export default async function Page({
  params,
}: {
  params: Promise<{ category: string; slug: string }>;
}) {
  const { category, slug } = await params;
  const hub = getHub(category, slug) ?? null;

  return (
    <Suspense fallback={null}>
      <HubRouteClient category={category} slug={slug} initialHub={hub} mode="full" />
    </Suspense>
  );
}
