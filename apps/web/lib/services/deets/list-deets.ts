import { createClient } from "@/lib/supabase/client";
import type { DeetRecord } from "@/lib/services/deets/deet-types";
import { DEET_COLUMNS, normalizeDeetRecord } from "@/lib/services/deets/query-utils";

type ListDeetsOptions = {
  hubIds?: string[];
  /**
   * Restrict to specific `kind` values (e.g. ["News", "Jobs", "Alerts"]).
   * When set, the query uses an IN filter so we only pull what the caller
   * needs — used by the Local page to grab news/alerts/jobs/deals from
   * every hub on the platform without dragging every post along for the ride.
   */
  kinds?: string[];
  limit?: number;
};

export async function listDeets(options?: ListDeetsOptions): Promise<DeetRecord[]> {
  const supabase = createClient();
  let query = supabase.from("deets").select(DEET_COLUMNS).order("created_at", { ascending: false });

  if (options?.hubIds?.length) {
    query = query.in("hub_id", options.hubIds);
  }

  if (options?.kinds?.length) {
    query = query.in("kind", options.kinds);
  }

  if (options?.limit) {
    query = query.limit(options.limit);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to load deets: ${error.message}`);
  }

  return ((data ?? []) as DeetRecord[]).map((record) => normalizeDeetRecord(record));
}

export function subscribeToDeets(
  onChange: () => void,
  options?: {
    hubIds?: string[];
  },
) {
  const supabase = createClient();
  const relevantHubIds = new Set(options?.hubIds ?? []);

  const channel = supabase
    .channel(`deets:${options?.hubIds?.join(",") || "all"}`)
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "deets" },
      (payload) => {
        if (!relevantHubIds.size) {
          onChange();
          return;
        }

        const record = (payload.new || payload.old || {}) as { hub_id?: string };
        if (record.hub_id && relevantHubIds.has(record.hub_id)) {
          onChange();
        }
      },
    )
    .subscribe();

  return () => {
    void supabase.removeChannel(channel);
  };
}
