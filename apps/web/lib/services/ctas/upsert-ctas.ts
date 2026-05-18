import {
  deleteHubCTAApi,
  listHubCTAsApi,
  saveAllHubCTAsApi,
} from "@/lib/api/hub-customization";
import type { UpsertCTAInput, HubCTARecord } from "./cta-types";
import { MAX_CTAS_PER_HUB } from "./cta-types";

/**
 * Upsert (create or update) a single CTA for a hub.
 * Returns the saved record or null on error.
 */
export async function upsertHubCTA(
  input: UpsertCTAInput
): Promise<HubCTARecord | null> {
  try {
    const existing = await listHubCTAsApi(input.hub_id);
    const next = [...existing];
    const idx = input.id ? next.findIndex((item) => item.id === input.id) : -1;

    const row = {
      id: input.id,
      label: input.label,
      action_type: input.action_type,
      action_value: input.action_value,
      position: input.position,
      is_visible: input.is_visible,
    };

    if (idx >= 0) {
      next[idx] = { ...next[idx], ...row };
    } else {
      next.push({
        id: input.id ?? crypto.randomUUID(),
        hub_id: input.hub_id,
        label: input.label,
        action_type: input.action_type,
        action_value: input.action_value,
        position: input.position,
        is_visible: input.is_visible,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    }

    const saved = await saveAllHubCTAsApi(
      input.hub_id,
      next.map((cta, index) => ({
        id: cta.id,
        label: cta.label,
        action_type: cta.action_type,
        action_value: cta.action_value,
        position: index,
        is_visible: cta.is_visible,
      })),
    );
    return saved.find((item) => item.id === (input.id ?? "")) ?? saved[input.position] ?? null;
  } catch (error) {
    console.error("[upsert-cta] Failed:", error);
    return null;
  }
}

/**
 * Batch-save all CTAs for a hub.
 * Deletes any existing CTAs not in the input list, then upserts the rest.
 * Enforces MAX_CTAS_PER_HUB limit.
 */
export async function saveAllHubCTAs(
  hubId: string,
  ctas: Omit<UpsertCTAInput, "hub_id">[]
): Promise<HubCTARecord[]> {
  if (ctas.length > MAX_CTAS_PER_HUB) {
    console.error(
      `[save-all-ctas] Exceeded max CTAs (${MAX_CTAS_PER_HUB}). Truncating.`
    );
    ctas = ctas.slice(0, MAX_CTAS_PER_HUB);
  }
  try {
    return await saveAllHubCTAsApi(hubId, ctas);
  } catch (error) {
    console.error("[save-all-ctas] Save failed:", error);
    return [];
  }
}

/**
 * Delete a single CTA by id.
 */
export async function deleteHubCTA(hubId: string, ctaId: string): Promise<boolean> {
  try {
    return await deleteHubCTAApi(hubId, ctaId);
  } catch (error) {
    console.error("[delete-cta] Failed:", error);
    return false;
  }
}
