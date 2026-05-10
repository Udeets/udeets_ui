/**
 * Canonical realtime event names (server → client).
 * Payloads mirror database rows where noted; IDs and timestamps are always DB-authoritative.
 */
export type ChatRealtimeServerEventName =
  | "message.created"
  | "message.edited"
  | "message.deleted"
  | "reaction.updated"
  | "poll.updated"
  | "typing.started"
  | "typing.stopped"
  | "room.member_joined"
  | "room.member_removed"
  | "moderation.message_hidden"
  | "report.created";

export type ChatRealtimeServerEvent =
  | { name: "message.created"; payload: { roomId: string; message: Record<string, unknown> } }
  | { name: "message.edited"; payload: { roomId: string; message: Record<string, unknown> } }
  | { name: "message.deleted"; payload: { roomId: string; message: Record<string, unknown> } }
  | {
      name: "moderation.message_hidden";
      payload: {
        roomId: string;
        messageId: string;
        moderationReason: string | null;
        deletedBy: string | null;
      };
    }
  | {
      name: "reaction.updated";
      payload: {
        roomId: string;
        messageId: string;
        kind: "added" | "removed";
        reaction?: Record<string, unknown>;
        reactionId?: string;
      };
    }
  | {
      name: "poll.updated";
      payload: { roomId: string; pollId: string; vote?: Record<string, unknown> | null; event: "INSERT" | "DELETE" };
    }
  | { name: "typing.started"; payload: { roomId: string; userId: string; updatedAt: string } }
  | { name: "typing.stopped"; payload: { roomId: string; userId: string } }
  | {
      name: "room.member_joined";
      payload: { roomId: string; userId: string; role: string; status: string; joinedAt: string | null };
    }
  | {
      name: "room.member_removed";
      payload: { roomId: string; userId: string; status: string };
    }
  | {
      name: "report.created";
      payload: {
        roomId: string;
        reportId: string;
        status: string;
        reporterId: string;
        targetMessageId: string | null;
        reason: string | null;
      };
    };

/** Client → server intent names (implemented via REST + Supabase Realtime subscriptions). */
export type ChatRealtimeClientIntent =
  | "room.join"
  | "room.leave"
  | "message.send"
  | "message.edit"
  | "message.delete"
  | "typing.started"
  | "typing.stopped"
  | "reaction.add"
  | "reaction.remove"
  | "poll.vote";
