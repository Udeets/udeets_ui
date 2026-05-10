import { createClient } from "@/lib/supabase/server";
import { assertChatVerb } from "@/lib/services/chat/assert-chat";
import { resolveChatAuthContext } from "@/lib/services/chat/resolve-chat-context";
import { fetchChatMessageForAuthz } from "@/lib/services/chat/resolve-chat-context";
import { ChatForbiddenError, ChatNotFoundError } from "@/lib/services/chat/chat-errors";

/** Server-side gate before registering private storage metadata for a message attachment. */
export async function assertChatAttachmentUploadAllowed(params: {
  userId: string;
  roomId: string;
  messageId: string;
}): Promise<void> {
  const supabase = await createClient();
  const msg = await fetchChatMessageForAuthz(supabase, params.messageId);
  if (!msg || msg.room_id !== params.roomId) throw new ChatForbiddenError("Access denied.");

  const ctx = await resolveChatAuthContext(supabase, params.roomId, params.userId);
  if (!ctx) throw new ChatForbiddenError("Access denied.");
  assertChatVerb(ctx, "UPLOAD_ATTACHMENT");

  if (msg.sender_id !== params.userId) {
    throw new ChatForbiddenError("You can only attach files to your own messages.");
  }
}
