import { createClient } from "@/lib/supabase/server";
import { assertChatVerb } from "@/lib/services/chat/assert-chat";
import { ChatForbiddenError, ChatNotFoundError } from "@/lib/services/chat/chat-errors";
import { resolveChatAuthContext } from "@/lib/services/chat/resolve-chat-context";

export async function deleteChatRoom(input: { userId: string; roomId: string }): Promise<void> {
  const supabase = await createClient();
  const ctx = await resolveChatAuthContext(supabase, input.roomId, input.userId);
  if (!ctx) throw new ChatNotFoundError("Chat room not found.");

  assertChatVerb(ctx, "DELETE_ROOM");

  const { error } = await supabase.from("chat_rooms").delete().eq("id", input.roomId);
  if (error) {
    console.error("[deleteChatRoom]", error);
    throw new ChatForbiddenError("Could not delete room.");
  }
}
