import type { ParsedChatRoomSettings } from "@/lib/services/chat/chat-types";

export type ChatRoomDetail = {
  id: string;
  hubId: string;
  name: string;
  description: string | null;
  archivedAt: string | null;
  createdAt: string;
  settings: ParsedChatRoomSettings;
  /** null = messages kept indefinitely; 30/90/365 = auto-purge policy (see cron / docs). */
  retentionDays: number | null;
  viewerMuted: boolean;
  viewerBanned: boolean;
  /** Room moderator+ or hub staff — used for moderation UI and realtime message visibility. */
  viewerCanModerate: boolean;
  /**
   * When set, the viewer has a pending invite and is not yet an active member (and is not hub staff).
   * UI should show join/decline instead of the message stream.
   */
  viewerPendingInvite: { inviteId: string; inviterDisplayName: string } | null;
};
