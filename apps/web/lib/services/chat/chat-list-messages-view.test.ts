import { describe, expect, it } from "vitest";

import { CHAT_DELETED_MESSAGE_PLACEHOLDER } from "@/lib/services/chat/chat-message-constants";
import { buildChatMessageListItemFromRow, type ChatMessageListRow } from "@/lib/services/chat/list-chat-messages";

const baseRow = (over: Partial<ChatMessageListRow> = {}): ChatMessageListRow => ({
  id: "m1",
  room_id: "r1",
  sender_id: "u1",
  message_kind: "text",
  body: "hello",
  created_at: "2026-01-01T00:00:00.000Z",
  edited_at: null,
  deleted_at: null,
  moderation_reason: null,
  sender_display_name_snapshot: "Pat",
  sender_avatar_url_snapshot: null,
  ...over,
});

describe("buildChatMessageListItemFromRow", () => {
  it("redacts deleted messages for normal members", () => {
    const m = buildChatMessageListItemFromRow(
      baseRow({ deleted_at: "2026-01-02T00:00:00.000Z", moderation_reason: "spam" }),
      false,
      "other-user",
      [],
      [],
    );
    expect(m.redacted).toBe(true);
    expect(m.body).toBe(CHAT_DELETED_MESSAGE_PLACEHOLDER);
    expect(m.senderId).toBe("u1");
    expect(m.senderDisplayName).toBe("Pat");
    expect(m.moderationReason).toBeNull();
  });

  it("shows body and moderation reason to moderators for hidden messages", () => {
    const m = buildChatMessageListItemFromRow(
      baseRow({ deleted_at: "2026-01-02T00:00:00.000Z", moderation_reason: "policy" }),
      true,
      "mod-user",
      [],
      [],
    );
    expect(m.redacted).toBe(false);
    expect(m.body).toBe("hello");
    expect(m.senderId).toBe("u1");
    expect(m.moderationReason).toBe("policy");
  });

  it("redacts a moderator's own deleted message (tombstone, not mod preview)", () => {
    const m = buildChatMessageListItemFromRow(
      baseRow({ sender_id: "u1", deleted_at: "2026-01-02T00:00:00.000Z", moderation_reason: null }),
      true,
      "u1",
      [],
      [],
    );
    expect(m.redacted).toBe(true);
    expect(m.body).toBe(CHAT_DELETED_MESSAGE_PLACEHOLDER);
    expect(m.senderId).toBe("u1");
    expect(m.senderDisplayName).toBe("Pat");
    expect(m.moderationReason).toBeNull();
  });
});
