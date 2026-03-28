"use client";

import HubClient from "./HubClient";
import type { HubRecord } from "@/lib/hubs";

export default function HubRouteClient({
  initialHub,
  mode = "intro",
}: {
  initialHub: HubRecord;
  mode?: "intro" | "full";
}) {
  return <HubClient hub={initialHub} mode={mode} />;
}
