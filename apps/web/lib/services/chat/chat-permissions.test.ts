import { describe, expect, it } from "vitest";

import type { ChatAuthContext } from "@/lib/services/chat/chat-permissions";
import {
  CHAT_PERMISSION_MATRIX,
  evaluateChatPermission,
  evaluateCreateChatRoom,
  evaluateListChatRoomsInHub,
} from "@/lib/services/chat/chat-permissions";

function baseRoom(overrides?: Partial<ChatAuthContext["room"]>): ChatAuthContext["room"] {
  return {
    id: "room-1",
    hubId: "hub-1",
    archivedAt: null,
    settings: {
      attachmentsEnabled: true,
      invitePolicy: "hub_admins_only",
      whoCanCreatePolls: "room_admin_and_moderator",
    },
    ...overrides,
  };
}

function ctx(partial: Partial<ChatAuthContext>): ChatAuthContext {
  return {
    userId: "user-1",
    room: baseRoom(),
    hubMembership: null,
    roomMembership: null,
    isMuted: false,
    isBanned: false,
    ...partial,
  };
}

describe("evaluateCreateChatRoom", () => {
  it("allows hub creator", () => {
    expect(evaluateCreateChatRoom({ role: "creator", status: "active" }).ok).toBe(true);
  });
  it("allows hub admin", () => {
    expect(evaluateCreateChatRoom({ role: "admin", status: "active" }).ok).toBe(true);
  });
  it("denies hub member", () => {
    const r = evaluateCreateChatRoom({ role: "member", status: "active" });
    expect(r.ok).toBe(false);
  });
  it("denies inactive hub admin", () => {
    const r = evaluateCreateChatRoom({ role: "admin", status: "pending" });
    expect(r.ok).toBe(false);
  });
});

describe("evaluateListChatRoomsInHub", () => {
  it("allows any active hub member", () => {
    expect(evaluateListChatRoomsInHub({ status: "active" }).ok).toBe(true);
  });
  it("denies non-member", () => {
    expect(evaluateListChatRoomsInHub(null).ok).toBe(false);
  });
});

describe("evaluateChatPermission VIEW_ROOM archived", () => {
  it("denies regular member when room archived", () => {
    const r = evaluateChatPermission(
      ctx({
        roomMembership: { role: "member", status: "active" },
        room: baseRoom({ archivedAt: "2020-01-01T00:00:00.000Z" }),
      }),
      "VIEW_ROOM",
    );
    expect(r.ok).toBe(false);
  });
  it("allows room admin when room archived", () => {
    const r = evaluateChatPermission(
      ctx({
        roomMembership: { role: "admin", status: "active" },
        room: baseRoom({ archivedAt: "2020-01-01T00:00:00.000Z" }),
      }),
      "VIEW_ROOM",
    );
    expect(r.ok).toBe(true);
  });
});

describe("evaluateChatPermission VIEW_ROOM", () => {
  it("allows active room member", () => {
    const r = evaluateChatPermission(
      ctx({
        roomMembership: { role: "member", status: "active" },
      }),
      "VIEW_ROOM",
    );
    expect(r.ok).toBe(true);
  });
  it("allows hub admin without room membership", () => {
    const r = evaluateChatPermission(
      ctx({
        hubMembership: { role: "admin", status: "active" },
        roomMembership: null,
      }),
      "VIEW_ROOM",
    );
    expect(r.ok).toBe(true);
  });
  it("denies stranger", () => {
    const r = evaluateChatPermission(ctx({}), "VIEW_ROOM");
    expect(r.ok).toBe(false);
  });
  it("denies invited-not-active member for non-archived room", () => {
    const r = evaluateChatPermission(
      ctx({ roomMembership: { role: "member", status: "invited" } }),
      "VIEW_ROOM",
    );
    expect(r.ok).toBe(false);
  });
});

describe("evaluateChatPermission SEND_MESSAGE", () => {
  it("denies when muted", () => {
    const r = evaluateChatPermission(
      ctx({
        roomMembership: { role: "member", status: "active" },
        isMuted: true,
      }),
      "SEND_MESSAGE",
    );
    expect(r.ok).toBe(false);
  });
  it("denies when banned", () => {
    const r = evaluateChatPermission(
      ctx({
        roomMembership: { role: "member", status: "active" },
        isBanned: true,
      }),
      "SEND_MESSAGE",
    );
    expect(r.ok).toBe(false);
  });
});

describe("evaluateChatPermission UPLOAD_ATTACHMENT", () => {
  it("denies when attachments disabled", () => {
    const r = evaluateChatPermission(
      ctx({
        roomMembership: { role: "member", status: "active" },
        room: baseRoom({
          settings: {
            attachmentsEnabled: false,
            invitePolicy: "hub_admins_only",
            whoCanCreatePolls: "room_admin_and_moderator",
          },
        }),
      }),
      "UPLOAD_ATTACHMENT",
    );
    expect(r.ok).toBe(false);
  });
});

describe("evaluateChatPermission CREATE_POLL_MESSAGE", () => {
  it("denies member when policy is room_admin_and_moderator", () => {
    const r = evaluateChatPermission(
      ctx({ roomMembership: { role: "member", status: "active" } }),
      "CREATE_POLL_MESSAGE",
    );
    expect(r.ok).toBe(false);
  });
  it("allows moderator", () => {
    const r = evaluateChatPermission(
      ctx({ roomMembership: { role: "moderator", status: "active" } }),
      "CREATE_POLL_MESSAGE",
    );
    expect(r.ok).toBe(true);
  });
  it("allows all members when policy allows", () => {
    const r = evaluateChatPermission(
      ctx({
        roomMembership: { role: "member", status: "active" },
        room: baseRoom({
          settings: {
            attachmentsEnabled: true,
            invitePolicy: "hub_admins_only",
            whoCanCreatePolls: "all_active_members",
          },
        }),
      }),
      "CREATE_POLL_MESSAGE",
    );
    expect(r.ok).toBe(true);
  });
});

describe("evaluateChatPermission DELETE_MESSAGE", () => {
  it("allows author to delete own", () => {
    const r = evaluateChatPermission(
      ctx({ userId: "u1", roomMembership: { role: "member", status: "active" } }),
      "DELETE_MESSAGE",
      { messageAuthorId: "u1", messageDeletedAt: null },
    );
    expect(r.ok).toBe(true);
  });
  it("denies other member deleting someone else message", () => {
    const r = evaluateChatPermission(
      ctx({ userId: "u1", roomMembership: { role: "member", status: "active" } }),
      "DELETE_MESSAGE",
      { messageAuthorId: "u2", messageDeletedAt: null },
    );
    expect(r.ok).toBe(false);
  });
  it("allows moderator to delete others", () => {
    const r = evaluateChatPermission(
      ctx({ userId: "u1", roomMembership: { role: "moderator", status: "active" } }),
      "DELETE_MESSAGE",
      { messageAuthorId: "u2", messageDeletedAt: null },
    );
    expect(r.ok).toBe(true);
  });
});

describe("evaluateChatPermission INVITE_USER", () => {
  it("denies hub admin when invitePolicy room_admins and not a room admin", () => {
    const r = evaluateChatPermission(
      ctx({
        hubMembership: { role: "admin", status: "active" },
        roomMembership: null,
        room: baseRoom({
          settings: {
            attachmentsEnabled: true,
            invitePolicy: "room_admins",
            whoCanCreatePolls: "room_admin_and_moderator",
          },
        }),
      }),
      "INVITE_USER",
    );
    expect(r.ok).toBe(false);
  });
  it("allows hub admin when invitePolicy hub_admins_only", () => {
    const r = evaluateChatPermission(
      ctx({
        hubMembership: { role: "admin", status: "active" },
        roomMembership: null,
      }),
      "INVITE_USER",
    );
    expect(r.ok).toBe(true);
  });
  it("denies room moderator when invitePolicy hub_admins_only", () => {
    const r = evaluateChatPermission(
      ctx({
        hubMembership: { role: "member", status: "active" },
        roomMembership: { role: "moderator", status: "active" },
      }),
      "INVITE_USER",
    );
    expect(r.ok).toBe(false);
  });
  it("allows room admin when invitePolicy room_admins", () => {
    const r = evaluateChatPermission(
      ctx({
        hubMembership: { role: "member", status: "active" },
        roomMembership: { role: "admin", status: "active" },
        room: baseRoom({ settings: { attachmentsEnabled: true, invitePolicy: "room_admins", whoCanCreatePolls: "room_admin_and_moderator" } }),
      }),
      "INVITE_USER",
    );
    expect(r.ok).toBe(true);
  });
});

describe("evaluateChatPermission CREATE_REPORT", () => {
  it("denies banned members", () => {
    const r = evaluateChatPermission(
      ctx({ roomMembership: { role: "member", status: "active" }, isBanned: true }),
      "CREATE_REPORT",
    );
    expect(r.ok).toBe(false);
  });

  it("allows active member", () => {
    const r = evaluateChatPermission(ctx({ roomMembership: { role: "member", status: "active" } }), "CREATE_REPORT");
    expect(r.ok).toBe(true);
  });
});

describe("evaluateChatPermission VIEW_REPORTS and UPDATE_REPORT_STATUS", () => {
  it("denies regular member", () => {
    expect(evaluateChatPermission(ctx({ roomMembership: { role: "member", status: "active" } }), "VIEW_REPORTS").ok).toBe(
      false,
    );
    expect(
      evaluateChatPermission(ctx({ roomMembership: { role: "member", status: "active" } }), "UPDATE_REPORT_STATUS").ok,
    ).toBe(false);
  });

  it("allows room moderator", () => {
    expect(
      evaluateChatPermission(ctx({ roomMembership: { role: "moderator", status: "active" } }), "VIEW_REPORTS").ok,
    ).toBe(true);
    expect(
      evaluateChatPermission(ctx({ roomMembership: { role: "moderator", status: "active" } }), "UPDATE_REPORT_STATUS").ok,
    ).toBe(true);
  });

  it("allows hub admin without room membership", () => {
    expect(evaluateChatPermission(ctx({ hubMembership: { role: "admin", status: "active" } }), "VIEW_REPORTS").ok).toBe(
      true,
    );
  });
});

describe("evaluateChatPermission MUTE_MEMBER and BAN_MEMBER", () => {
  it("allows room moderator to mute", () => {
    expect(
      evaluateChatPermission(ctx({ roomMembership: { role: "moderator", status: "active" } }), "MUTE_MEMBER").ok,
    ).toBe(true);
  });

  it("denies room moderator from banning", () => {
    const r = evaluateChatPermission(ctx({ roomMembership: { role: "moderator", status: "active" } }), "BAN_MEMBER");
    expect(r.ok).toBe(false);
  });

  it("allows room admin to ban", () => {
    expect(evaluateChatPermission(ctx({ roomMembership: { role: "admin", status: "active" } }), "BAN_MEMBER").ok).toBe(
      true,
    );
  });

  it("allows hub staff to ban without room role", () => {
    expect(evaluateChatPermission(ctx({ hubMembership: { role: "admin", status: "active" } }), "BAN_MEMBER").ok).toBe(
      true,
    );
  });
});

describe("evaluateChatPermission DELETE_ROOM", () => {
  it("allows hub admin without room membership", () => {
    expect(evaluateChatPermission(ctx({ hubMembership: { role: "admin", status: "active" } }), "DELETE_ROOM").ok).toBe(
      true,
    );
  });

  it("allows room owner", () => {
    expect(evaluateChatPermission(ctx({ roomMembership: { role: "owner", status: "active" } }), "DELETE_ROOM").ok).toBe(
      true,
    );
  });

  it("denies room moderator", () => {
    const r = evaluateChatPermission(ctx({ roomMembership: { role: "moderator", status: "active" } }), "DELETE_ROOM");
    expect(r.ok).toBe(false);
  });

  it("denies plain member", () => {
    const r = evaluateChatPermission(ctx({ roomMembership: { role: "member", status: "active" } }), "DELETE_ROOM");
    expect(r.ok).toBe(false);
  });
});

describe("CHAT_PERMISSION_MATRIX", () => {
  it("documents each verb", () => {
    expect(CHAT_PERMISSION_MATRIX.length).toBeGreaterThanOrEqual(10);
  });
});
