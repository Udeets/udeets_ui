import type { ChatRoomDbRole, HubMemberDbRole, ParsedChatRoomSettings } from "@/lib/services/chat/chat-types";

/** Resolved subject for permission checks (no DB I/O — unit-test friendly). */
export type ChatAuthContext = {
  userId: string;
  room: {
    id: string;
    hubId: string;
    archivedAt: string | null;
    settings: ParsedChatRoomSettings;
  };
  /** Active hub membership for `room.hubId`, if any. */
  hubMembership: { role: HubMemberDbRole; status: string } | null;
  /** Room membership for `userId`, if any. */
  roomMembership: { role: ChatRoomDbRole; status: string } | null;
  /** Whether `userId` is actively muted in the room (including time-bounded). */
  isMuted: boolean;
  /** Whether `userId` is banned from the room. */
  isBanned: boolean;
  /** Pending `chat_room_invites` row for this user in this room, if any. */
  pendingInviteId: string | null;
};

export type ChatPermissionVerb =
  | "VIEW_ROOM"
  | "SEND_MESSAGE"
  | "UPLOAD_ATTACHMENT"
  | "CREATE_POLL_MESSAGE"
  | "VOTE_POLL"
  | "EDIT_OWN_MESSAGE"
  | "DELETE_MESSAGE"
  | "INVITE_USER"
  | "REMOVE_MEMBER"
  | "MUTE_MEMBER"
  | "BAN_MEMBER"
  | "VIEW_REPORTS"
  | "VIEW_MODERATION_LOGS"
  | "UPDATE_ROOM_SETTINGS"
  | "ARCHIVE_ROOM"
  | "DELETE_ROOM"
  | "LIST_ROOM_MEMBERS"
  | "REACT_TO_MESSAGE"
  | "CREATE_REPORT"
  | "UPDATE_REPORT_STATUS"
  | "ADD_ROOM_MEMBER";

export type DeleteMessageSubject = {
  messageAuthorId: string | null;
  /** Soft-deleted messages: treat as not deletable by non-mods except no-op edge cases */
  messageDeletedAt: string | null;
};

function isHubStaff(hub: ChatAuthContext["hubMembership"]): boolean {
  if (!hub || hub.status !== "active") return false;
  return hub.role === "creator" || hub.role === "admin";
}

function isActiveRoomMember(m: ChatAuthContext["roomMembership"]): boolean {
  return !!m && m.status === "active";
}

function isRoomModPlus(m: ChatAuthContext["roomMembership"]): boolean {
  if (!isActiveRoomMember(m)) return false;
  return m!.role === "owner" || m!.role === "admin" || m!.role === "moderator";
}

function isRoomAdminPlus(m: ChatAuthContext["roomMembership"]): boolean {
  if (!isActiveRoomMember(m)) return false;
  return m!.role === "owner" || m!.role === "admin";
}

function canViewRoomCore(ctx: ChatAuthContext): boolean {
  if (ctx.room.archivedAt) {
    return isHubStaff(ctx.hubMembership) || isRoomAdminPlus(ctx.roomMembership);
  }
  return isActiveRoomMember(ctx.roomMembership) || isHubStaff(ctx.hubMembership);
}

/**
 * Centralized chat authorization (mirrors product matrix).
 * Call only after `ctx` is built from trusted DB lookups (never trust client hub_id).
 */
/** Hub-scoped: create a new chat room under this hub. */
export function evaluateCreateChatRoom(
  hubMembership: { role: HubMemberDbRole; status: string } | null,
): { ok: true } | { ok: false; reason: string } {
  if (hubMembership?.status === "active" && (hubMembership.role === "creator" || hubMembership.role === "admin")) {
    return { ok: true };
  }
  return { ok: false, reason: "Only hub creators or admins can create chat rooms." };
}

/** Hub-scoped: list chat rooms for a hub (member sees subset in query; gate is hub membership). */
export function evaluateListChatRoomsInHub(
  hubMembership: { status: string } | null,
): { ok: true } | { ok: false; reason: string } {
  if (hubMembership?.status === "active") return { ok: true };
  return { ok: false, reason: "You must be an active hub member to list chat rooms." };
}

export function evaluateChatPermission(
  ctx: ChatAuthContext,
  verb: ChatPermissionVerb,
  extra?: DeleteMessageSubject,
): { ok: true } | { ok: false; reason: string } {
  switch (verb) {
    case "VIEW_ROOM": {
      if (canViewRoomCore(ctx)) return { ok: true };
      if (
        ctx.hubMembership?.status === "active" &&
        ctx.pendingInviteId &&
        !ctx.room.archivedAt
      ) {
        return { ok: true };
      }
      return { ok: false, reason: "You do not have access to this chat room." };
    }
    case "SEND_MESSAGE": {
      if (!canViewRoomCore(ctx)) return { ok: false, reason: "You do not have access to this chat room." };
      if (!isActiveRoomMember(ctx.roomMembership))
        return { ok: false, reason: "Only active room members can send messages." };
      if (ctx.isBanned) return { ok: false, reason: "You are banned from this room." };
      if (ctx.isMuted) return { ok: false, reason: "You are muted in this room." };
      return { ok: true };
    }
    case "UPLOAD_ATTACHMENT": {
      const base = evaluateChatPermission(ctx, "SEND_MESSAGE");
      if (!base.ok) return base;
      if (!ctx.room.settings.attachmentsEnabled) {
        return { ok: false, reason: "Attachments are disabled for this room." };
      }
      return { ok: true };
    }
    case "CREATE_POLL_MESSAGE": {
      const base = evaluateChatPermission(ctx, "SEND_MESSAGE");
      if (!base.ok) return base;
      const pol = ctx.room.settings.whoCanCreatePolls;
      const rm = ctx.roomMembership;
      if (pol === "all_active_members") return { ok: true };
      if (pol === "room_admin_only") {
        if (isRoomAdminPlus(rm)) return { ok: true };
        return { ok: false, reason: "Only room owners or admins can create polls here." };
      }
      // room_admin_and_moderator (default)
      if (isRoomModPlus(rm)) return { ok: true };
      return { ok: false, reason: "Only room moderators or admins can create polls here." };
    }
    case "VOTE_POLL": {
      if (!canViewRoomCore(ctx)) return { ok: false, reason: "You do not have access to this chat room." };
      if (!isActiveRoomMember(ctx.roomMembership))
        return { ok: false, reason: "Only active room members can vote." };
      if (ctx.isBanned) return { ok: false, reason: "You are banned from this room." };
      return { ok: true };
    }
    case "EDIT_OWN_MESSAGE": {
      if (!canViewRoomCore(ctx)) return { ok: false, reason: "You do not have access to this chat room." };
      if (!isActiveRoomMember(ctx.roomMembership))
        return { ok: false, reason: "Only active room members can edit messages." };
      if (ctx.isBanned) return { ok: false, reason: "You are banned from this room." };
      return { ok: true };
    }
    case "DELETE_MESSAGE": {
      if (!extra) return { ok: false, reason: "Missing message context." };
      if (!canViewRoomCore(ctx)) return { ok: false, reason: "You do not have access to this chat room." };
      if (extra.messageDeletedAt && !isRoomModPlus(ctx.roomMembership) && !isHubStaff(ctx.hubMembership)) {
        return { ok: false, reason: "This message is already deleted." };
      }
      const authorId = extra.messageAuthorId;
      const isOwn = authorId !== null && authorId === ctx.userId;
      if (isRoomModPlus(ctx.roomMembership) || isHubStaff(ctx.hubMembership)) {
        return { ok: true };
      }
      if (isOwn && isActiveRoomMember(ctx.roomMembership) && !ctx.isBanned) {
        return { ok: true };
      }
      return { ok: false, reason: "You cannot delete this message." };
    }
    case "INVITE_USER": {
      if (!canViewRoomCore(ctx)) return { ok: false, reason: "You do not have access to this chat room." };
      if (ctx.room.settings.invitePolicy === "room_admins") {
        if (isRoomAdminPlus(ctx.roomMembership)) return { ok: true };
        return { ok: false, reason: "Only room owners or admins can invite users to this room." };
      }
      // hub_admins_only (default): hub creator/admin, even if not a room member.
      if (isHubStaff(ctx.hubMembership)) return { ok: true };
      return { ok: false, reason: "Only hub creators or admins can invite users to this room." };
    }
    case "REMOVE_MEMBER": {
      if (isHubStaff(ctx.hubMembership)) return { ok: true };
      if (isRoomAdminPlus(ctx.roomMembership)) return { ok: true };
      return { ok: false, reason: "Only hub staff or room owners/admins can remove members." };
    }
    case "ADD_ROOM_MEMBER": {
      if (isHubStaff(ctx.hubMembership)) return { ok: true };
      if (isRoomAdminPlus(ctx.roomMembership)) return { ok: true };
      return { ok: false, reason: "Only hub staff or room owners/admins can add members." };
    }
    case "MUTE_MEMBER": {
      if (!canViewRoomCore(ctx)) return { ok: false, reason: "You do not have access to this chat room." };
      if (isRoomModPlus(ctx.roomMembership) || isHubStaff(ctx.hubMembership)) return { ok: true };
      return { ok: false, reason: "Only moderators or admins can mute members." };
    }
    case "BAN_MEMBER": {
      if (!canViewRoomCore(ctx)) return { ok: false, reason: "You do not have access to this chat room." };
      if (isRoomAdminPlus(ctx.roomMembership) || isHubStaff(ctx.hubMembership)) return { ok: true };
      return { ok: false, reason: "Only room owners/admins or hub staff can ban users from this room." };
    }
    case "VIEW_REPORTS":
    case "VIEW_MODERATION_LOGS":
    case "UPDATE_REPORT_STATUS": {
      if (!canViewRoomCore(ctx)) return { ok: false, reason: "You do not have access to this chat room." };
      if (isRoomModPlus(ctx.roomMembership) || isHubStaff(ctx.hubMembership)) return { ok: true };
      return { ok: false, reason: "Only moderators or admins can view reports and moderation logs." };
    }
    case "UPDATE_ROOM_SETTINGS":
    case "ARCHIVE_ROOM": {
      if (!canViewRoomCore(ctx)) return { ok: false, reason: "You do not have access to this chat room." };
      if (isHubStaff(ctx.hubMembership) || isRoomAdminPlus(ctx.roomMembership)) return { ok: true };
      return { ok: false, reason: "Only hub staff or room owners/admins can update this room." };
    }
    case "DELETE_ROOM": {
      if (!canViewRoomCore(ctx)) return { ok: false, reason: "You do not have access to this chat room." };
      if (isHubStaff(ctx.hubMembership) || isRoomAdminPlus(ctx.roomMembership)) return { ok: true };
      return { ok: false, reason: "Only hub staff or room owners/admins can delete this room." };
    }
    case "LIST_ROOM_MEMBERS": {
      return evaluateChatPermission(ctx, "VIEW_ROOM");
    }
    case "REACT_TO_MESSAGE": {
      return evaluateChatPermission(ctx, "SEND_MESSAGE");
    }
    case "CREATE_REPORT": {
      if (!canViewRoomCore(ctx)) return { ok: false, reason: "You do not have access to this chat room." };
      if (!isActiveRoomMember(ctx.roomMembership))
        return { ok: false, reason: "Only active room members can submit reports." };
      if (ctx.isBanned) return { ok: false, reason: "You are banned from this room." };
      return { ok: true };
    }
    default: {
      const _exhaustive: never = verb;
      return { ok: false, reason: `Unknown permission ${_exhaustive}` };
    }
  }
}

/** Permission matrix for docs / tests (human-readable). */
export const CHAT_PERMISSION_MATRIX: ReadonlyArray<{
  verb: ChatPermissionVerb | "CREATE_ROOM" | "LIST_ROOMS_IN_HUB";
  rule: string;
}> = [
  { verb: "CREATE_ROOM", rule: "Hub hub_members.role in (creator, admin), status active." },
  { verb: "LIST_ROOMS_IN_HUB", rule: "Any active hub member for that hub_id." },
  { verb: "VIEW_ROOM", rule: "Active room member, OR hub staff; archived: hub staff or room owner/admin; OR active hub member with pending room invite (non-archived)." },
  { verb: "SEND_MESSAGE", rule: "Active room member; not muted; not banned; room not blocked for viewer." },
  { verb: "UPLOAD_ATTACHMENT", rule: "Same as SEND_MESSAGE + room.settings.attachmentsEnabled." },
  {
    verb: "CREATE_POLL_MESSAGE",
    rule: "Same as SEND_MESSAGE + whoCanCreatePolls (default: moderator+ and room admin+).",
  },
  { verb: "VOTE_POLL", rule: "Active room member; not banned." },
  { verb: "EDIT_OWN_MESSAGE", rule: "Active room member; not banned; author check done at service layer." },
  {
    verb: "DELETE_MESSAGE",
    rule: "Message author (active member) OR room moderator+ OR hub staff; hub staff bypass for moderation.",
  },
  {
    verb: "INVITE_USER",
    rule: "invitePolicy hub_admins_only → hub staff; room_admins → room owner/admin.",
  },
  { verb: "REMOVE_MEMBER", rule: "Hub staff OR room owner/admin." },
  { verb: "ADD_ROOM_MEMBER", rule: "Hub staff OR room owner/admin." },
  { verb: "MUTE_MEMBER", rule: "Room moderator+ OR hub staff." },
  { verb: "BAN_MEMBER", rule: "Room owner/admin OR hub staff." },
  { verb: "VIEW_REPORTS", rule: "Room moderator+ OR hub staff." },
  { verb: "VIEW_MODERATION_LOGS", rule: "Room moderator+ OR hub staff." },
  { verb: "UPDATE_REPORT_STATUS", rule: "Same as VIEW_REPORTS (resolve/dismiss)." },
  { verb: "UPDATE_ROOM_SETTINGS", rule: "Hub staff OR room owner/admin." },
  { verb: "ARCHIVE_ROOM", rule: "Hub staff OR room owner/admin." },
  { verb: "DELETE_ROOM", rule: "Hub staff OR room owner/admin; permanently removes room and messages (DB cascade)." },
  { verb: "LIST_ROOM_MEMBERS", rule: "Same as VIEW_ROOM." },
  { verb: "REACT_TO_MESSAGE", rule: "Same as SEND_MESSAGE." },
  {
    verb: "CREATE_REPORT",
    rule: "Active room member; not banned. API requires a short `reason` string (stored on the report row).",
  },
];
