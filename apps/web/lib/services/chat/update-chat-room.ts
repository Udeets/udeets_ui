import { createClient } from "@/lib/supabase/server";
import { assertChatVerb } from "@/lib/services/chat/assert-chat";
import { mergeChatRoomSettings, parseChatRoomSettings } from "@/lib/services/chat/chat-room-settings";
import { isAllowedChatRetentionDays } from "@/lib/services/chat/chat-retention";
import type { ParsedChatRoomSettings } from "@/lib/services/chat/chat-types";
import { ChatForbiddenError, ChatNotFoundError } from "@/lib/services/chat/chat-errors";
import { resolveChatAuthContext } from "@/lib/services/chat/resolve-chat-context";

export type UpdateChatRoomInput = {
  userId: string;
  roomId: string;
  name?: string;
  description?: string | null;
  settingsPatch?: Partial<ParsedChatRoomSettings>;
  /** When set, updates `archived_at` to now (archive) or null (unarchive). */
  archived?: boolean;
  /** null = indefinite; 30 / 90 / 365 = retention purge window. */
  retentionDays?: number | null;
};

export async function updateChatRoom(input: UpdateChatRoomInput): Promise<void> {
  const supabase = await createClient();
  const ctx = await resolveChatAuthContext(supabase, input.roomId, input.userId);
  if (!ctx) throw new ChatNotFoundError("Chat room not found.");

  assertChatVerb(ctx, "UPDATE_ROOM_SETTINGS");

  if (input.retentionDays !== undefined && !isAllowedChatRetentionDays(input.retentionDays)) {
    throw new ChatForbiddenError("Invalid message retention setting.");
  }

  const { data: row, error: readErr } = await supabase
    .from("chat_rooms")
    .select("settings")
    .eq("id", input.roomId)
    .single();

  if (readErr || !row) throw new ChatForbiddenError("Could not load room settings.");

  const current = parseChatRoomSettings(row.settings);
  const nextSettings = input.settingsPatch ? mergeChatRoomSettings(current, input.settingsPatch) : undefined;

  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (input.name !== undefined) patch.name = input.name.trim();
  if (input.description !== undefined) patch.description = input.description;
  if (nextSettings !== undefined) patch.settings = nextSettings as object;
  if (input.archived === true) patch.archived_at = new Date().toISOString();
  if (input.archived === false) patch.archived_at = null;
  if (input.retentionDays !== undefined) patch.retention_days = input.retentionDays;

  const { error } = await supabase.from("chat_rooms").update(patch).eq("id", input.roomId);
  if (error) {
    console.error("[updateChatRoom]", error);
    throw new ChatForbiddenError("Could not update room.");
  }
}
