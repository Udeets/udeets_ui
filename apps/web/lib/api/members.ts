import { apiFetch } from "@/lib/api/client";
import type { HubMember, MemberRole, MemberStatus } from "@/lib/services/members/member-types";
import type { MyMembership } from "@/lib/services/members/list-my-memberships";

type MemberRow = {
  id?: string | null;
  hub_id: string;
  user_id: string;
  role: string;
  status: string;
  joined_at: string | null;
};

type MyMembershipRow = {
  id?: string | null;
  hub_id: string;
  role: string;
  status: string;
  joined_at: string | null;
};

export async function listHubMembersFromApi(hubId: string): Promise<HubMember[]> {
  const rows = await apiFetch<MemberRow[]>(`/hubs/${encodeURIComponent(hubId)}/members`);
  return rows.map((row) => ({
    hubId: row.hub_id,
    userId: row.user_id,
    role: row.role as MemberRole,
    status: row.status as MemberStatus,
    joinedAt: row.joined_at,
  }));
}

export async function listMyMembershipsFromApi(accessToken: string): Promise<MyMembership[]> {
  const rows = await apiFetch<MyMembershipRow[]>("/memberships/me", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  return rows.map((row) => ({
    id: row.id ?? null,
    hubId: row.hub_id,
    role: row.role as MemberRole,
    status: row.status as MemberStatus,
    joinedAt: row.joined_at,
  }));
}

export async function listPendingHubMembersFromApi(hubId: string): Promise<HubMember[]> {
  const rows = await apiFetch<MemberRow[]>(`/memberships/hubs/${encodeURIComponent(hubId)}/pending`);
  return rows.map((row) => ({
    hubId: row.hub_id,
    userId: row.user_id,
    role: row.role as MemberRole,
    status: row.status as MemberStatus,
    joinedAt: row.joined_at,
  }));
}

export async function approveHubMemberFromApi(hubId: string, userId: string): Promise<boolean> {
  const response = await apiFetch<{ ok: boolean }>(
    `/memberships/hubs/${encodeURIComponent(hubId)}/members/${encodeURIComponent(userId)}/approve`,
    { method: "POST" },
  );
  return Boolean(response.ok);
}

export async function rejectHubMemberFromApi(hubId: string, userId: string): Promise<boolean> {
  const response = await apiFetch<{ ok: boolean }>(
    `/memberships/hubs/${encodeURIComponent(hubId)}/members/${encodeURIComponent(userId)}/reject`,
    { method: "POST" },
  );
  return Boolean(response.ok);
}

export async function leaveHubFromApi(hubId: string): Promise<boolean> {
  const response = await apiFetch<{ ok: boolean }>(`/memberships/hubs/${encodeURIComponent(hubId)}/leave`, {
    method: "POST",
  });
  return Boolean(response.ok);
}

export async function getMyHubMembershipFromApi(hubId: string): Promise<HubMember | null> {
  const row = await apiFetch<MemberRow | null>(`/memberships/hubs/${encodeURIComponent(hubId)}/me`);
  if (!row) return null;
  return {
    hubId: row.hub_id,
    userId: row.user_id,
    role: row.role as MemberRole,
    status: row.status as MemberStatus,
    joinedAt: row.joined_at,
  };
}

export async function joinHubFromApi(hubId: string): Promise<HubMember> {
  const row = await apiFetch<MemberRow>(`/memberships/hubs/${encodeURIComponent(hubId)}/join`, {
    method: "POST",
  });
  return {
    hubId: row.hub_id,
    userId: row.user_id,
    role: row.role as MemberRole,
    status: row.status as MemberStatus,
    joinedAt: row.joined_at,
  };
}
