import {
  disableHubJoinLinkFromApi,
  fetchOrCreateHubJoinLinkFromApi,
  regenerateHubJoinLinkFromApi,
  resolveHubJoinTokenFromApi,
  setHubJoinLinkExpirationFromApi,
} from "@/lib/api/invites";
import { getCurrentSession } from "@/services/auth/getCurrentSession";

export type HubJoinLinkState = {
  token: string;
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
  const session = await getCurrentSession();
  const token = session?.access_token;
  if (!token) return null;
  return fetchOrCreateHubJoinLinkFromApi(hubId, token, expiresInDays);
}

export async function regenerateHubJoinLink(
  hubId: string,
  expiresInDays?: number | null,
): Promise<HubJoinLinkState | null> {
  const session = await getCurrentSession();
  const token = session?.access_token;
  if (!token) return null;
  return regenerateHubJoinLinkFromApi(hubId, token, expiresInDays);
}

export async function disableHubJoinLink(hubId: string): Promise<boolean> {
  const session = await getCurrentSession();
  const token = session?.access_token;
  if (!token) return false;
  return disableHubJoinLinkFromApi(hubId, token);
}

export async function setHubJoinLinkExpiration(
  hubId: string,
  expiresInDays: number | null,
): Promise<string | null> {
  const session = await getCurrentSession();
  const token = session?.access_token;
  if (!token) return null;
  return setHubJoinLinkExpirationFromApi(hubId, token, expiresInDays);
}

export type ResolvedJoinLink = {
  hubId: string;
  category: string;
  slug: string;
  hubName: string;
  isValid: boolean;
};

export async function resolveHubJoinToken(token: string): Promise<ResolvedJoinLink | null> {
  return resolveHubJoinTokenFromApi(token);
}
