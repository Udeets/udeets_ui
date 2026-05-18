export type ChatRoomListItem = {
  id: string;
  hubId: string;
  name: string;
  description: string | null;
  archivedAt: string | null;
  createdAt: string;
  /** Present when this row is shown because of a pending invite (not yet an active member). */
  pendingInviteId?: string;
};
