import { updateHubApi } from "@/lib/api/hubs";
import type { HubRecord, UpdateHubInput } from "@/lib/services/hubs/hub-types";

export async function updateHub(hubId: string, input: UpdateHubInput): Promise<HubRecord> {
  if (!hubId.trim()) {
    throw new Error("Hub id is required.");
  }
  return updateHubApi(hubId.trim(), input);
}
