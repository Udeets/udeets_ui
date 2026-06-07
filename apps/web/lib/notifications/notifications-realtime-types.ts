export type NotificationEventType =
  | "chat.hub_unread"
  | "chat.hub_read"
  | "chat.room_unread"
  | "chat.room_read"
  | "feed.invalidate"
  | "unread.changed"
  | "member.pending"
  | "member.join_accepted";

export type NotificationEventEnvelope = {
  event_id: string;
  event_type: NotificationEventType;
  user_id: string;
  created_at: string;
  payload: Record<string, unknown>;
};

export type NotificationRealtimeServerMessage =
  | { type: "pong" }
  | { type: "event"; envelope: NotificationEventEnvelope }
  | { type: "error"; code?: string; message?: string };
