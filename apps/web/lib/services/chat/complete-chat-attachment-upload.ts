import { createClient } from "@/lib/supabase/server";
import {
  validateAttachmentStorageKeyLayout,
  validateChatAttachmentMime,
  validateChatAttachmentSize,
} from "@/lib/services/chat/chat-attachment-media";
import { assertChatAttachmentUploadAllowed } from "@/lib/services/chat/assert-chat-attachment";
import { ChatForbiddenError } from "@/lib/services/chat/chat-errors";
import { resolveChatAuthContext } from "@/lib/services/chat/resolve-chat-context";

export async function completeChatAttachmentUpload(input: {
  userId: string;
  roomId: string;
  messageId: string;
  storageKey: string;
  mimeType: string;
  originalFilename: string;
  sizeBytes: number;
}): Promise<{ attachmentId: string }> {
  validateChatAttachmentMime(input.mimeType);
  validateChatAttachmentSize(input.mimeType, input.sizeBytes);

  await assertChatAttachmentUploadAllowed({
    userId: input.userId,
    roomId: input.roomId,
    messageId: input.messageId,
  });

  const supabase = await createClient();
  const ctx = await resolveChatAuthContext(supabase, input.roomId, input.userId);
  if (!ctx) throw new ChatForbiddenError("Access denied.");

  validateAttachmentStorageKeyLayout({
    storageKey: input.storageKey,
    userId: input.userId,
    hubId: ctx.room.hubId,
    roomId: input.roomId,
    messageId: input.messageId,
  });

  const { data, error } = await supabase
    .from("chat_message_attachments")
    .insert({
      message_id: input.messageId,
      storage_key: input.storageKey,
      mime_type: input.mimeType,
      original_filename: input.originalFilename,
      file_size_bytes: input.sizeBytes,
      uploaded_by: input.userId,
      scan_status: "pending",
    })
    .select("id")
    .single();

  if (error || !data?.id) {
    console.error("[completeChatAttachmentUpload]", error);
    throw new ChatForbiddenError("Could not save attachment metadata.");
  }

  return { attachmentId: data.id as string };
}
