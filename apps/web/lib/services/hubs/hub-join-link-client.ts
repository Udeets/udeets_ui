import { createClient } from "@/lib/supabase/client";

function joinLinkRpcArgs(hubId: string, expiresInDays?: number | null): { p_hub_id: string; p_expires_in_days?: number } {
  const args: { p_hub_id: string; p_expires_in_days?: number } = { p_hub_id: hubId };
  if (expiresInDays != null && expiresInDays > 0) {
    args.p_expires_in_days = expiresInDays;
  }
  return args;
}

function logHubJoinLinkRpcError(label: string, error: { message?: string; code?: string; details?: string; hint?: string }) {
  console.error(`[${label}]`, error.message || error.code || error, {
    code: error.code,
    details: error.details,
    hint: error.hint,
  });
}

export type HubJoinLinkState = {  token: string;
  expiresAt: string | null;
  disabled: boolean;
};

export function buildHubJoinUrl(
  origin: string,
  hubCategory: string,
  hubSlug: string,
  token: string,
  deetId?: string,
): string {
  const base = `${origin}/hubs/${hubCategory}/${hubSlug}/join`;
  const params = new URLSearchParams({ t: token });
  if (deetId) params.set("deet", deetId);
  return `${base}?${params.toString()}`;
}

export async function fetchOrCreateHubJoinLink(
  hubId: string,
  expiresInDays?: number | null,
): Promise<HubJoinLinkState | null> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("hub_join_link_get_or_create", joinLinkRpcArgs(hubId, expiresInDays));

  if (error) {
    logHubJoinLinkRpcError("hub_join_link_get_or_create", error);
    return null;
  }

  const row = Array.isArray(data) ? data[0] : data;
  if (!row?.token) return null;

  return {
    token: row.token as string,
    expiresAt: (row.expires_at as string | null) ?? null,
    disabled: Boolean(row.disabled),
  };
}

export async function regenerateHubJoinLink(
  hubId: string,
  expiresInDays?: number | null,
): Promise<HubJoinLinkState | null> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("hub_join_link_regenerate", joinLinkRpcArgs(hubId, expiresInDays));

  if (error) {
    logHubJoinLinkRpcError("hub_join_link_regenerate", error);
    return null;
  }

  const row = Array.isArray(data) ? data[0] : data;
  if (!row?.token) return null;

  return {
    token: row.token as string,
    expiresAt: (row.expires_at as string | null) ?? null,
    disabled: false,
  };
}

export async function disableHubJoinLink(hubId: string): Promise<boolean> {
  const supabase = createClient();
  const { error } = await supabase.rpc("hub_join_link_disable", { p_hub_id: hubId });
  if (error) {
    logHubJoinLinkRpcError("hub_join_link_disable", error);
    return false;
  }
  return true;
}

export async function setHubJoinLinkExpiration(
  hubId: string,
  expiresInDays: number | null,
): Promise<string | null> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc(
    "hub_join_link_set_expiration",
    expiresInDays != null && expiresInDays > 0
      ? { p_hub_id: hubId, p_expires_in_days: expiresInDays }
      : { p_hub_id: hubId, p_expires_in_days: 0 },
  );
  if (error) {
    logHubJoinLinkRpcError("hub_join_link_set_expiration", error);
    return null;
  }
  return (data as string | null) ?? null;
}

export type ResolvedJoinLink = {
  hubId: string;
  category: string;
  slug: string;
  hubName: string;
  isValid: boolean;
};

export async function resolveHubJoinToken(token: string): Promise<ResolvedJoinLink | null> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("hub_join_link_resolve", { p_token: token });
  if (error) {
    logHubJoinLinkRpcError("hub_join_link_resolve", error);
    return null;
  }
  const row = Array.isArray(data) ? data[0] : data;
  if (!row?.is_valid) {
    return {
      hubId: "",
      category: "",
      slug: "",
      hubName: "",
      isValid: false,
    };
  }
  return {
    hubId: row.hub_id as string,
    category: row.category as string,
    slug: row.slug as string,
    hubName: row.hub_name as string,
    isValid: true,
  };
}
