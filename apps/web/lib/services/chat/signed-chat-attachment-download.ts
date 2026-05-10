import { createClient } from "@/lib/supabase/server";
import { assertChatVerb } from "@/lib/services/chat/assert-chat";
import { isChatAttachmentDownloadBlocked } from "@/lib/services/chat/chat-attachment-media";
import { ChatForbiddenError, ChatNotFoundError } from "@/lib/services/chat/chat-errors";
import { resolveChatAuthContext } from "@/lib/services/chat/resolve-chat-context";

const BUCKET = "chat-media";

export async function createSignedChatAttachmentDownloadUrl(input: {
  userId: string;
  roomId: string;
  attachmentId: string;
  expiresIn?: number;
}): Promise<{ url: string; expiresIn: number }> {
  const supabase = await createClient();
  const ctx = await resolveChatAuthContext(supabase, input.roomId, input.userId);
  if (!ctx) throw new ChatNotFoundError("Chat room not found.");
  assertChatVerb(ctx, "VIEW_ROOM");

  const { data: att, error: aErr } = await supabase
    .from("chat_message_attachments")
    .select("id, storage_key, message_id, deleted_at")
    .eq("id", input.attachmentId)
    .maybeSingle();

  if (aErr || !att) throw new ChatForbiddenError("Access denied.");

  const { data: msg, error: mErr } = await supabase
    .from("chat_messages")
    .select("room_id, deleted_at")
    .eq("id", att.message_id as string)
    .maybeSingle();

  if (mErr || !msg || (msg.room_id as string) !== input.roomId) {
    throw new ChatForbiddenError("Access denied.");
  }

  if (isChatAttachmentDownloadBlocked(att.deleted_at as string | null, (msg.deleted_at as string | null) ?? null)) {
    throw new ChatNotFoundError("Attachment is not available.");
  }

  const path = att.storage_key as string;
  const requested = input.expiresIn ?? 120;
  /** Clamp signed URL TTL (seconds) — never trust callers with long-lived URLs. */
  const ttl = Math.min(600, Math.max(60, Math.floor(Number.isFinite(requested) ? requested : 120)));

  const { data: signed, error: sErr } = await supabase.storage.from(BUCKET).createSignedUrl(path, ttl);
  if (sErr || !signed?.signedUrl) {
    console.error("[createSignedChatAttachmentDownloadUrl] signed URL failed");
    throw new ChatForbiddenError("Could not create download URL.");
  }

  return { url: signed.signedUrl, expiresIn: ttl };
}
