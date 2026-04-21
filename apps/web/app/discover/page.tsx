import { Suspense } from "react";
import type { Hub as SupabaseHubRow } from "@/types/hub";
import { getSupabasePublishableOrAnonKey, getSupabaseUrl } from "@/lib/supabase/env";
import DiscoverPageContent from "./DiscoverPageContent";

type HubRowWithCount = SupabaseHubRow & { _memberCount?: number };

export default async function DiscoverPage() {
  const SUPABASE_URL = getSupabaseUrl();
  const SUPABASE_KEY = getSupabasePublishableOrAnonKey();

  let initialHubs: HubRowWithCount[] = [];

  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/hubs?select=*&order=created_at.desc`,
      {
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
        },
        cache: "no-store",
      }
    );
    if (res.ok) {
      const hubs = (await res.json()) as SupabaseHubRow[];
      // Fetch active member counts
      const hubIds: string[] = hubs.map((h) => h.id);
      const countMap = new Map<string, number>();
      if (hubIds.length > 0) {
        try {
          const membersRes = await fetch(
            `${SUPABASE_URL}/rest/v1/hub_members?select=hub_id&status=eq.active&hub_id=in.(${hubIds.join(",")})`,
            {
              headers: {
                apikey: SUPABASE_KEY,
                Authorization: `Bearer ${SUPABASE_KEY}`,
              },
              cache: "no-store",
            }
          );
          if (membersRes.ok) {
            const memberRows: Array<{ hub_id: string }> = await membersRes.json();
            for (const row of memberRows) {
              countMap.set(row.hub_id, (countMap.get(row.hub_id) ?? 0) + 1);
            }
          }
        } catch {
          // Member counts will default to 0
        }
      }
      // Attach _memberCount so client can use it
      initialHubs = hubs.map((h) => ({ ...h, _memberCount: countMap.get(h.id) ?? 0 }));
    }
  } catch (e) {
    console.error("[discover] server fetch:", e);
  }

  return (
    <Suspense fallback={null}>
      <DiscoverPageContent initialHubs={initialHubs} />
    </Suspense>
  );
}
