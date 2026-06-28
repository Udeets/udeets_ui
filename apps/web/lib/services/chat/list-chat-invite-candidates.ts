export type ChatInviteCandidateDto = {
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  hubRole: string;
  /** Active membership in this chat room */
  inRoom: boolean;
  /** Pending invite for this room + user (not yet accepted). */
  pendingInvite: boolean;
};
