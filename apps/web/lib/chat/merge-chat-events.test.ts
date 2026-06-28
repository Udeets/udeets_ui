import { describe, expect, it } from "vitest";

import type { ChatMessageViewModel } from "@/lib/chat/chat-message-view";
import {
  applyMessageEnvelope,
  applyReactionEnvelope,
  prependMessageIfNew,
} from "@/lib/chat/merge-chat-events";
import type { ChatEventEnvelope } from "@/lib/chat/chat-realtime-types";

const base: ChatMessageViewModel = {
  id: "a",
  roomId: "r",
  messageKind: "text",
  createdAt: "2026-05-17T10:00:00.000Z",
  editedAt: null,
  deletedAt: null,
  senderId: "u1",
  senderDisplayName: "A",
  senderAvatarUrl: null,
  body: "hi",
  attachments: [],
  reactions: [],
  redacted: false,
};

describe("prependMessageIfNew", () => {
  it("prepends unseen messages", () => {
    const next = prependMessageIfNew([base], {
      ...base,
      id: "b",
      createdAt: "2026-05-17T11:00:00.000Z",
    });
    expect(next.map((m) => m.id)).toEqual(["b", "a"]);
  });
});

describe("applyMessageEnvelope", () => {
  it("applies message.created", () => {
    const envelope: ChatEventEnvelope = {
      event_id: "e1",
      event_type: "message.created",
      room_id: "r",
      message_id: "b",
      created_at: "2026-05-17T11:00:00.000Z",
      payload: {
        id: "b",
        room_id: "r",
        sender_id: "u2",
        message_kind: "text",
        body: "new",
        created_at: "2026-05-17T11:00:00.000Z",
      },
    };
    const next = applyMessageEnvelope([base], envelope);
    expect(next.some((m) => m.id === "b")).toBe(true);
  });
});

describe("applyReactionEnvelope", () => {
  it("adds and removes reactions", () => {
    const envelopeAdded: ChatEventEnvelope = {
      event_id: "e2",
      event_type: "reaction.updated",
      room_id: "r",
      message_id: "a",
      created_at: "2026-05-17T12:00:00.000Z",
      payload: {
        kind: "added",
        reaction: { user_id: "u2", emoji: "👍" },
      },
    };
    const withReaction = applyReactionEnvelope([base], envelopeAdded);
    expect(withReaction[0].reactions).toHaveLength(1);

    const envelopeRemoved: ChatEventEnvelope = {
      ...envelopeAdded,
      event_id: "e3",
      payload: { kind: "removed", reaction: { user_id: "u2", emoji: "👍" } },
    };
    const cleared = applyReactionEnvelope(withReaction, envelopeRemoved);
    expect(cleared[0].reactions).toHaveLength(0);
  });
});
