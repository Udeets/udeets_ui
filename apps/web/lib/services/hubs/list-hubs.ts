import { listHubsFromApi } from "@/lib/api/hubs";
import type { Hub } from "@/types/hub";

export interface ListHubsOptions {
  /** Reserved for future filtering; all hub listing goes through FastAPI. */
  requireAuth?: boolean;
}

export async function listHubs(options?: ListHubsOptions): Promise<Hub[]> {
  void options;
  return listHubsFromApi();
}
