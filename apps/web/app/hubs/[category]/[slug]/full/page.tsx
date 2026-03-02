import { notFound } from "next/navigation";
import HubClient from "../HubClient";
import { getHub } from "@/lib/hubs";

export default async function Page({
  params,
}: {
  params: Promise<{ category: string; slug: string }>;
}) {
  const { category, slug } = await params;

  const hub = getHub(category, slug);
  if (!hub) return notFound();

  // For now, HubClient will render the FULL view when it detects "/full"
  return <HubClient hub={hub} mode="full" category={category} slug={slug} />;
}