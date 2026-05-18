export type ChatModerationActionRow = {
  id: string;
  actionType: string;
  reason: string | null;
  actorId: string;
  targetUserId: string | null;
  targetMessageId: string | null;
  createdAt: string;
  metadata: Record<string, unknown>;
};
