import { createClient } from "@/lib/supabase/server";
import { assertChatVerb } from "@/lib/services/chat/assert-chat";
import { ChatForbiddenError, ChatNotFoundError } from "@/lib/services/chat/chat-errors";
import { resolveChatAuthContext } from "@/lib/services/chat/resolve-chat-context";

export type ChatTypingPhase = "started" | "stopped";

export async function recordChatTypingPhase(input: {
  userId: string;
  roomId: string;
  phase: ChatTypingPhase;
}): Promise<void> {
  const supabase = await createClient();
  const ctx = await resolveChatAuthContext(supabase, input.roomId, input.userId);
  if (!ctx) throw new ChatNotFoundError("Chat room not found.");
  assertChatVerb(ctx, "VIEW_ROOM");

  if (input.phase === "stopped") {
    const { error } = await supabase
      .from("chat_room_typing")
      .delete()
      .eq("room_id", input.roomId)
      .eq("user_id", input.userId);
    if (error) {
      console.error("[recordChatTypingPhase] delete", error);
      throw new ChatForbiddenError("Could not clear typing state.");
    }
    return;
  }

  const { error } = await supabase.from("chat_room_typing").upsert(
    {
      room_id: input.roomId,
      user_id: input.userId,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "room_id,user_id" },
  );

  if (error) {
    console.error("[recordChatTypingPhase] upsert", error);
    throw new ChatForbiddenError("Could not record typing state.");
  }
}
