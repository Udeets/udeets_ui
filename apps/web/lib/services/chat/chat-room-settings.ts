import type {
  ChatPollCreationPolicy,
  ChatRoomInvitePolicy,
  ParsedChatRoomSettings,
} from "@/lib/services/chat/chat-types";

const DEFAULTS: ParsedChatRoomSettings = {
  attachmentsEnabled: true,
  invitePolicy: "hub_admins_only",
  whoCanCreatePolls: "room_admin_and_moderator",
};

/** Normalize `chat_rooms.settings` JSONB for permission checks. */
export function mergeChatRoomSettings(
  base: ParsedChatRoomSettings,
  patch: Partial<ParsedChatRoomSettings>,
): ParsedChatRoomSettings {
  return {
    attachmentsEnabled: patch.attachmentsEnabled ?? base.attachmentsEnabled,
    invitePolicy: patch.invitePolicy ?? base.invitePolicy,
    whoCanCreatePolls: patch.whoCanCreatePolls ?? base.whoCanCreatePolls,
  };
}

export function parseChatRoomSettings(raw: unknown): ParsedChatRoomSettings {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return { ...DEFAULTS };
  }
  const o = raw as Record<string, unknown>;

  const invitePolicy: ChatRoomInvitePolicy =
    o.invitePolicy === "room_admins" ? "room_admins" : "hub_admins_only";

  let whoCanCreatePolls: ChatPollCreationPolicy = DEFAULTS.whoCanCreatePolls;
  if (o.whoCanCreatePolls === "room_admin_only") whoCanCreatePolls = "room_admin_only";
  else if (o.whoCanCreatePolls === "all_active_members") whoCanCreatePolls = "all_active_members";
  else if (o.whoCanCreatePolls === "room_admin_and_moderator") whoCanCreatePolls = "room_admin_and_moderator";

  const attachmentsEnabled = o.attachmentsEnabled === false ? false : true;

  return { attachmentsEnabled, invitePolicy, whoCanCreatePolls };
}
