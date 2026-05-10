import type { ChatRealtimeServerEvent } from "@/lib/services/chat/chat-realtime-contract";

function record(payload: unknown): Record<string, unknown> {
  return payload && typeof payload === "object" ? (payload as Record<string, unknown>) : {};
}

function isNonEmptyTimestamp(v: unknown): boolean {
  if (v == null) return false;
  const s = String(v).trim();
  return s.length > 0 && s !== "null";
}

/**
 * Maps Supabase Realtime `postgres_changes` payloads to uDeets chat server events.
 * @see subscribeChatRoomRealtime
 */
export function mapChatPostgresPayloadToServerEvents(payload: unknown): ChatRealtimeServerEvent[] {
  const p = record(payload);
  const eventType = String(p.eventType ?? "");
  const table = String(p.table ?? "");
  const newRow = record(p.new);
  const oldRow = record(p.old);

  if (table === "chat_messages") {
    if (eventType === "INSERT") {
      const roomId = String(newRow.room_id ?? "");
      if (!roomId || !newRow.id) return [];
      return [{ name: "message.created", payload: { roomId, message: newRow } }];
    }
    if (eventType === "UPDATE") {
      const wasDeleted = isNonEmptyTimestamp(oldRow.deleted_at);
      const isDeleted = isNonEmptyTimestamp(newRow.deleted_at);
      const roomId = String(newRow.room_id ?? oldRow.room_id ?? "");
      const id = String(newRow.id ?? oldRow.id ?? "");
      if (!wasDeleted && isDeleted) {
        const out: ChatRealtimeServerEvent[] = [
          { name: "message.deleted", payload: { roomId, message: newRow } },
        ];
        const modReason = newRow.moderation_reason != null ? String(newRow.moderation_reason).trim() : "";
        if (modReason) {
          out.push({
            name: "moderation.message_hidden",
            payload: {
              roomId,
              messageId: id,
              moderationReason: modReason,
              deletedBy: newRow.deleted_by != null ? String(newRow.deleted_by) : null,
            },
          });
        }
        return out;
      }
      if (newRow.id) {
        return [{ name: "message.edited", payload: { roomId, message: newRow } }];
      }
    }
    return [];
  }

  if (table === "chat_message_reactions") {
    const roomId = String(newRow.room_id ?? oldRow.room_id ?? "");
    const messageId = String(newRow.message_id ?? oldRow.message_id ?? "");
    if (!roomId || !messageId) return [];
    if (eventType === "INSERT") {
      return [{ name: "reaction.updated", payload: { roomId, messageId, kind: "added", reaction: newRow } }];
    }
    if (eventType === "DELETE") {
      const old = oldRow;
      return [
        {
          name: "reaction.updated",
          payload: {
            roomId,
            messageId,
            kind: "removed",
            reaction: Object.keys(old).length ? old : undefined,
            reactionId: old.id != null ? String(old.id) : undefined,
          },
        },
      ];
    }
    return [];
  }

  if (table === "chat_poll_votes") {
    const roomId = String(newRow.room_id ?? oldRow.room_id ?? "");
    const pollId = String(newRow.poll_id ?? oldRow.poll_id ?? "");
    if (!roomId || !pollId) return [];
    const voteRow = eventType === "INSERT" ? newRow : oldRow;
    return [
      {
        name: "poll.updated",
        payload: {
          roomId,
          pollId,
          vote: eventType === "INSERT" ? voteRow : null,
          event: eventType === "DELETE" ? "DELETE" : "INSERT",
        },
      },
    ];
  }

  if (table === "chat_room_typing") {
    const roomId = String(newRow.room_id ?? oldRow.room_id ?? "");
    const userId = String(newRow.user_id ?? oldRow.user_id ?? "");
    if (!roomId || !userId) return [];
    if (eventType === "INSERT" || eventType === "UPDATE") {
      const updatedAt =
        newRow.updated_at != null ? String(newRow.updated_at) : new Date().toISOString();
      return [{ name: "typing.started", payload: { roomId, userId, updatedAt } }];
    }
    if (eventType === "DELETE") {
      return [{ name: "typing.stopped", payload: { roomId, userId } }];
    }
    return [];
  }

  if (table === "chat_message_reports") {
    if (eventType === "INSERT") {
      const status = String(newRow.status ?? "");
      if (status !== "pending") return [];
      return [
        {
          name: "report.created",
          payload: {
            roomId: String(newRow.room_id ?? ""),
            reportId: String(newRow.id ?? ""),
            status,
            reporterId: String(newRow.reporter_id ?? ""),
            targetMessageId: newRow.target_message_id != null ? String(newRow.target_message_id) : null,
            reason: newRow.reason != null ? String(newRow.reason) : null,
          },
        },
      ];
    }
    return [];
  }

  if (table === "chat_room_memberships") {
    const roomId = String(newRow.room_id ?? oldRow.room_id ?? "");
    const userId = String(newRow.user_id ?? oldRow.user_id ?? "");
    if (!roomId || !userId) return [];

    if (eventType === "INSERT") {
      const status = String(newRow.status ?? "");
      if (status !== "active") return [];
      return [
        {
          name: "room.member_joined",
          payload: {
            roomId,
            userId,
            role: String(newRow.role ?? "member"),
            status,
            joinedAt: newRow.joined_at != null ? String(newRow.joined_at) : null,
          },
        },
      ];
    }

    if (eventType === "UPDATE") {
      const oldStatus = String(oldRow.status ?? "");
      const newStatus = String(newRow.status ?? "");
      if (oldStatus !== "active" && newStatus === "active") {
        return [
          {
            name: "room.member_joined",
            payload: {
              roomId,
              userId,
              role: String(newRow.role ?? "member"),
              status: newStatus,
              joinedAt: newRow.joined_at != null ? String(newRow.joined_at) : null,
            },
          },
        ];
      }
      if (oldStatus === "active" && newStatus !== "active") {
        return [{ name: "room.member_removed", payload: { roomId, userId, status: newStatus } }];
      }
    }
  }

  return [];
}
