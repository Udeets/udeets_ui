import { notFound } from "next/navigation";
import HubClient from "./HubClient";
import { allHubParams, getHub } from "@/lib/hubs";

export function generateStaticParams() {
  // Optional: works fine for v0/static build behavior
  return allHubParams();
}

export default async function Page({
  params,
}: {
  params: Promise<{ category: string; slug: string }>;
}) {
  const { category, slug } = await params;

  const hub = getHub(category, slug);
  if (!hub) return notFound();

  return <HubClient hub={hub} />;
}