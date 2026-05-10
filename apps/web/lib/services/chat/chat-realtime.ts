import type { SupabaseClient } from "@supabase/supabase-js";

import { assertChatVerb } from "@/lib/services/chat/assert-chat";
import { resolveChatAuthContext } from "@/lib/services/chat/resolve-chat-context";
import { ChatNotFoundError } from "@/lib/services/chat/chat-errors";

/**
 * Server-side guard before subscribing to `chat_messages` Realtime for a room.
 * Supabase Realtime `postgres_changes` still enforces RLS on delivery; this helper
 * prevents the app from opening subscriptions when the user fails centralized checks.
 */
export async function assertCanSubscribeToChatMessages(
  supabase: SupabaseClient,
  roomId: string,
  userId: string,
): Promise<void> {
  const ctx = await resolveChatAuthContext(supabase, roomId, userId);
  if (!ctx) throw new ChatNotFoundError("Chat room not found.");
  assertChatVerb(ctx, "VIEW_ROOM");
}
