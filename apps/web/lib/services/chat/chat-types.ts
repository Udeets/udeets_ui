/** Hub-level role from `hub_members.role`. */
export type HubMemberDbRole = "creator" | "admin" | "member";

/** Room-level role from `chat_room_memberships.role`. */
export type ChatRoomDbRole = "owner" | "admin" | "moderator" | "member";

/** Parsed `chat_rooms.settings` JSON (unknown keys ignored). */
export type ChatRoomInvitePolicy = "hub_admins_only" | "room_admins";

/** Who may create poll messages in the room (default: moderators + room admins). */
export type ChatPollCreationPolicy = "room_admin_and_moderator" | "room_admin_only" | "all_active_members";

export type ParsedChatRoomSettings = {
  attachmentsEnabled: boolean;
  invitePolicy: ChatRoomInvitePolicy;
  whoCanCreatePolls: ChatPollCreationPolicy;
};

export type ChatRoomRow = {
  id: string;
  hub_id: string;
  name: string;
  description: string | null;
  archived_at: string | null;
  settings: unknown;
};

export type HubMemberRow = {
  hub_id: string;
  user_id: string;
  role: HubMemberDbRole;
  status: string;
};

export type ChatRoomMembershipRow = {
  room_id: string;
  user_id: string;
  role: ChatRoomDbRole;
  status: string;
};

export type ChatMessageRow = {
  id: string;
  room_id: string;
  sender_id: string | null;
  message_kind: string;
  deleted_at: string | null;
};
