import { apiFetch } from "@/lib/api/client";
import type { ResolvedJoinLink } from "@/lib/services/hubs/hub-join-link-client";

export type PendingInvitation = {
  invitationId: string;
  hubId: string;
  hubName: string;
  hubCategory: string;
  hubSlug: string;
  dpImage: string;
  invitedAt: string | null;
  invitedByName: string;
};

type PendingInvitationRow = {
  invitation_id: string;
  hub_id: string;
  hub_name: string;
  hub_category: string;
  hub_slug: string;
  dp_image: string;
  invited_at: string | null;
  invited_by_name: string;
};

type ResolvedJoinLinkRow = {
  hub_id: string;
  category: string;
  slug: string;
  hub_name: string;
  is_valid: boolean;
};

type HubJoinLinkStateRow = {
  token: string;
  expires_at: string | null;
  disabled: boolean;
};

export async function resolveHubJoinTokenFromApi(token: string): Promise<ResolvedJoinLink | null> {
  const row = await apiFetch<ResolvedJoinLinkRow>("/join-links/resolve", {
    query: { token },
  });
  if (!row.is_valid) {
    return {
      hubId: "",
      category: "",
      slug: "",
      hubName: "",
      isValid: false,
    };
  }
  return {
    hubId: row.hub_id,
    category: row.category,
    slug: row.slug,
    hubName: row.hub_name,
    isValid: true,
  };
}

export async function fetchOrCreateHubJoinLinkFromApi(
  hubId: string,
  accessToken: string,
  expiresInDays?: number | null
): Promise<{ token: string; expiresAt: string | null; disabled: boolean } | null> {
  const row = await apiFetch<HubJoinLinkStateRow>(`/join-links/${encodeURIComponent(hubId)}`, {
    query: expiresInDays != null ? { expires_in_days: expiresInDays } : undefined,
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return {
    token: row.token,
    expiresAt: row.expires_at,
    disabled: row.disabled,
  };
}

export async function regenerateHubJoinLinkFromApi(
  hubId: string,
  accessToken: string,
  expiresInDays?: number | null
): Promise<{ token: string; expiresAt: string | null; disabled: boolean } | null> {
  const row = await apiFetch<HubJoinLinkStateRow>(`/join-links/${encodeURIComponent(hubId)}/regenerate`, {
    method: "POST",
    query: expiresInDays != null ? { expires_in_days: expiresInDays } : undefined,
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return {
    token: row.token,
    expiresAt: row.expires_at,
    disabled: row.disabled,
  };
}

export async function disableHubJoinLinkFromApi(
  hubId: string,
  accessToken: string
): Promise<boolean> {
  await apiFetch<{ ok: boolean }>(`/join-links/${encodeURIComponent(hubId)}/disable`, {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return true;
}

export async function setHubJoinLinkExpirationFromApi(
  hubId: string,
  accessToken: string,
  expiresInDays: number | null
): Promise<string | null> {
  const response = await apiFetch<{ expires_at: string | null }>(`/join-links/${encodeURIComponent(hubId)}/expiration`, {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}` },
    body: { expires_in_days: expiresInDays },
  });
  return response.expires_at ?? null;
}

export async function sendHubContactInviteFromApi(
  hubId: string,
  accessToken: string,
  contactType: "email" | "phone",
  contactValue: string,
  expiresInDays: 7 | 30 | 90 | null
): Promise<boolean> {
  await apiFetch<{ ok: boolean }>(`/hubs/${encodeURIComponent(hubId)}/invites/contact`, {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}` },
    body: {
      contact_type: contactType,
      contact_value: contactValue,
      expires_in_days: expiresInDays,
    },
  });
  return true;
}

export async function listPendingInvitationsFromApi(accessToken: string): Promise<PendingInvitation[]> {
  const rows = await apiFetch<PendingInvitationRow[]>("/invitations/me", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  return rows.map((row) => ({
    invitationId: row.invitation_id,
    hubId: row.hub_id,
    hubName: row.hub_name,
    hubCategory: row.hub_category,
    hubSlug: row.hub_slug,
    dpImage: row.dp_image || "",
    invitedAt: row.invited_at,
    invitedByName: row.invited_by_name || "Someone",
  }));
}

export async function acceptInvitationFromApi(
  invitationId: string,
  accessToken: string
): Promise<boolean> {
  await apiFetch<{ ok: boolean }>(`/invitations/${encodeURIComponent(invitationId)}/accept`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
  return true;
}

export async function declineInvitationFromApi(
  invitationId: string,
  accessToken: string
): Promise<boolean> {
  await apiFetch<{ ok: boolean }>(`/invitations/${encodeURIComponent(invitationId)}/decline`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
  return true;
}
