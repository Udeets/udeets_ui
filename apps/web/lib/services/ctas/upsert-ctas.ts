import { createClient } from "@/lib/supabase/client";
import type { UpsertCTAInput, HubCTARecord } from "./cta-types";
import { MAX_CTAS_PER_HUB } from "./cta-types";

/**
 * Upsert (create or update) a single CTA for a hub.
 * Returns the saved record or null on error.
 */
export async function upsertHubCTA(
  input: UpsertCTAInput
): Promise<HubCTARecord | null> {
  const supabase = createClient();

  const row = {
    hub_id: input.hub_id,
    label: input.label,
    action_type: input.action_type,
    action_value: input.action_value,
    position: input.position,
    is_visible: input.is_visible,
    updated_at: new Date().toISOString(),
    ...(input.id ? { id: input.id } : {}),
  };

  const { data, error } = await supabase
    .from("hub_ctas")
    .upsert(row, { onConflict: "id" })
    .select("*")
    .single();

  if (error) {
    console.error("[upsert-cta] Failed:", error);
    return null;
  }

  return data as HubCTARecord;
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

  const supabase = createClient();

  // 1. Delete all existing CTAs for this hub
  const { error: deleteError } = await supabase
    .from("hub_ctas")
    .delete()
    .eq("hub_id", hubId);

  if (deleteError) {
    console.error("[save-all-ctas] Delete failed:", deleteError);
    return [];
  }

  if (ctas.length === 0) return [];

  // 2. Insert fresh rows with correct positions
  const rows = ctas.map((cta, index) => ({
    hub_id: hubId,
    label: cta.label,
    action_type: cta.action_type,
    action_value: cta.action_value,
    position: index,
    is_visible: cta.is_visible,
  }));

  const { data, error: insertError } = await supabase
    .from("hub_ctas")
    .insert(rows)
    .select("*");

  if (insertError) {
    console.error("[save-all-ctas] Insert failed:", insertError);
    return [];
  }

  return (data ?? []) as HubCTARecord[];
}

/**
 * Delete a single CTA by id.
 */
export async function deleteHubCTA(ctaId: string): Promise<boolean> {
  const supabase = createClient();

  const { error } = await supabase.from("hub_ctas").delete().eq("id", ctaId);

  if (error) {
    console.error("[delete-cta] Failed:", error);
    return false;
  }

  return true;
}
