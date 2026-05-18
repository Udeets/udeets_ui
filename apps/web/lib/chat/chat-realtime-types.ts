export type ChatRealtimeServerMessage =
  | { type: "event"; envelope: ChatEventEnvelope }
  | { type: "pong" }
  | { type: "room.joined"; roomId: string }
  | { type: "room.access_revoked"; roomId: string; reason?: string }
  | { type: "error"; code: string; message: string };

export type ChatRealtimeClientMessage =
  | { type: "room.join"; roomId: string; lastSeenMessageId?: string | null }
  | { type: "room.leave"; roomId: string }
  | { type: "ping" };

export type ChatEventType =
  | "message.created"
  | "message.edited"
  | "message.deleted"
  | "moderation.message_hidden"
  | "reaction.updated"
  | "poll.updated"
  | "room.member_joined"
  | "room.member_removed"
  | "room.access_revoked"
  | "typing.started"
  | "typing.stopped"
  | "typing.snapshot";

export type ChatEventEnvelope = {
  event_id: string;
  event_type: ChatEventType;
  room_id: string;
  message_id: string | null;
  created_at: string;
  payload: Record<string, unknown>;
};
