export const MEMBER_ROLES = ["creator", "admin", "member"] as const;
export type MemberRole = (typeof MEMBER_ROLES)[number];

export const MEMBER_STATUSES = ["active", "invited", "pending"] as const;
export type MemberStatus = (typeof MEMBER_STATUSES)[number];

export interface HubMember {
  hubId: string;
  userId: string;
  role: MemberRole;
  status: MemberStatus;
  joinedAt?: string | null;
}

export interface HubInvite {
  id: string;
  hubId: string;
  invitedBy: string;
  inviteeEmail?: string | null;
  inviteeUserId?: string | null;
  status: MemberStatus;
  createdAt?: string | null;
}
