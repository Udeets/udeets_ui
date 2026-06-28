import { apiFetch } from "@/lib/api/client";
import type { HubCTARecord, UpsertCTAInput } from "@/lib/services/ctas/cta-types";
import type { HubSection } from "@/lib/services/sections/section-types";

type SaveSectionInput = {
  id?: string;
  title: string;
  position: number;
  is_visible: boolean;
  items: Array<{
    id?: string;
    label: string;
    tag: string | null;
    value: string | null;
    position: number;
  }>;
};

export async function listHubSectionsApi(hubId: string): Promise<HubSection[]> {
  const response = await apiFetch<{ sections: HubSection[] }>(`/hubs/${encodeURIComponent(hubId)}/sections`);
  return response.sections ?? [];
}

export async function saveHubSectionsApi(hubId: string, sections: SaveSectionInput[]): Promise<HubSection[]> {
  const response = await apiFetch<{ sections: HubSection[] }>(`/hubs/${encodeURIComponent(hubId)}/sections`, {
    method: "PUT",
    body: sections,
  });
  return response.sections ?? [];
}

export async function listHubCTAsApi(hubId: string): Promise<HubCTARecord[]> {
  const response = await apiFetch<{ ctas: HubCTARecord[] }>(`/hubs/${encodeURIComponent(hubId)}/ctas`);
  return response.ctas ?? [];
}

export async function saveAllHubCTAsApi(
  hubId: string,
  ctas: Omit<UpsertCTAInput, "hub_id">[],
): Promise<HubCTARecord[]> {
  const response = await apiFetch<{ ctas: HubCTARecord[] }>(`/hubs/${encodeURIComponent(hubId)}/ctas`, {
    method: "PUT",
    body: ctas,
  });
  return response.ctas ?? [];
}

export async function deleteHubCTAApi(hubId: string, ctaId: string): Promise<boolean> {
  const response = await apiFetch<{ ok: boolean }>(
    `/hubs/${encodeURIComponent(hubId)}/ctas/${encodeURIComponent(ctaId)}`,
    { method: "DELETE" },
  );
  return Boolean(response.ok);
}
