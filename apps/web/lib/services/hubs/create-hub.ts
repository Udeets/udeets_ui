import { createHubApi } from "@/lib/api/hubs";
import type { CreateHubInput, HubRecord } from "@/lib/services/hubs/hub-types";

export async function createHub(input: CreateHubInput): Promise<HubRecord> {
  const name = input.name.trim();
  const slug = input.slug.trim().toLowerCase();
  const category = input.category;

  if (!name) {
    throw new Error("Hub name is required.");
  }

  if (!slug) {
    throw new Error("Hub slug is required.");
  }

  if (!category) {
    throw new Error("Hub category is required.");
  }
  return createHubApi({
    ...input,
    name,
    slug,
    category,
  });
}
