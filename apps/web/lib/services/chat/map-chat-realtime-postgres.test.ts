import { describe, expect, it } from "vitest";

import { mapChatPostgresPayloadToServerEvents } from "@/lib/services/chat/map-chat-realtime-postgres";

const room = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const msg = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const user = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";

describe("mapChatPostgresPayloadToServerEvents", () => {
  it("maps message INSERT to message.created", () => {
    const evs = mapChatPostgresPayloadToServerEvents({
      eventType: "INSERT",
      schema: "public",
      table: "chat_messages",
      commit_timestamp: "",
      new: { id: msg, room_id: room, body: "hi", sender_id: user },
      old: {},
      errors: [],
    });
    expect(evs[0]?.name).toBe("message.created");
    expect((evs[0] as { payload: { roomId: string } })?.payload.roomId).toBe(room);
  });

  it("maps soft delete UPDATE to message.deleted and moderation.message_hidden when reason set", () => {
    const evs = mapChatPostgresPayloadToServerEvents({
      eventType: "UPDATE",
      schema: "public",
      table: "chat_messages",
      commit_timestamp: "",
      new: {
        id: msg,
        room_id: room,
        deleted_at: "2026-01-01T00:00:00Z",
        moderation_reason: "spam",
        deleted_by: user,
      },
      old: { id: msg, room_id: room, deleted_at: null },
      errors: [],
    });
    expect(evs.map((e) => e.name)).toEqual(["message.deleted", "moderation.message_hidden"]);
  });

  it("maps reaction INSERT to reaction.updated added", () => {
    const evs = mapChatPostgresPayloadToServerEvents({
      eventType: "INSERT",
      schema: "public",
      table: "chat_message_reactions",
      commit_timestamp: "",
      new: { id: "r1", room_id: room, message_id: msg, user_id: user, emoji: "👍" },
      old: {},
      errors: [],
    });
    expect(evs[0]).toMatchObject({
      name: "reaction.updated",
      payload: { roomId: room, messageId: msg, kind: "added" },
    });
  });

  it("maps typing DELETE to typing.stopped", () => {
    const evs = mapChatPostgresPayloadToServerEvents({
      eventType: "DELETE",
      schema: "public",
      table: "chat_room_typing",
      commit_timestamp: "",
      new: {},
      old: { room_id: room, user_id: user },
      errors: [],
    });
    expect(evs).toEqual([{ name: "typing.stopped", payload: { roomId: room, userId: user } }]);
  });

  it("maps chat_message_reports INSERT pending to report.created", () => {
    const report = "dddddddd-dddd-4ddd-8ddd-dddddddddddd";
    const evs = mapChatPostgresPayloadToServerEvents({
      eventType: "INSERT",
      schema: "public",
      table: "chat_message_reports",
      commit_timestamp: "",
      new: {
        id: report,
        room_id: room,
        status: "pending",
        reporter_id: user,
        target_message_id: msg,
        reason: "spam",
      },
      old: {},
      errors: [],
    });
    expect(evs).toEqual([
      {
        name: "report.created",
        payload: {
          roomId: room,
          reportId: report,
          status: "pending",
          reporterId: user,
          targetMessageId: msg,
          reason: "spam",
        },
      },
    ]);
  });
});
