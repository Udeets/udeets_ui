import { randomUUID } from "node:crypto";

import { createClient } from "@/lib/supabase/server";
import {
  getChatAttachmentMaxBytesForMime,
  validateChatAttachmentMime,
  validateChatAttachmentSize,
} from "@/lib/services/chat/chat-attachment-media";
import { assertChatAttachmentUploadAllowed } from "@/lib/services/chat/assert-chat-attachment";
import { ChatForbiddenError } from "@/lib/services/chat/chat-errors";
import { resolveChatAuthContext } from "@/lib/services/chat/resolve-chat-context";

const BUCKET = "chat-media";

function safeSegment(name: string): string {
  return name
    .trim()
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120) || "file";
}

export type PrepareChatAttachmentUploadResult = {
  bucket: string;
  /** Opaque object key; client must send this back to complete — never a public URL. */
  storageKey: string;
  signedUploadUrl: string;
  token: string;
  maxBytesForMime: number;
};

export async function prepareChatAttachmentUpload(input: {
  userId: string;
  roomId: string;
  messageId: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
}): Promise<PrepareChatAttachmentUploadResult> {
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

  const maxBytesForMime = getChatAttachmentMaxBytesForMime(input.mimeType);

  const storageKey = `${input.userId}/${ctx.room.hubId}/${input.roomId}/${input.messageId}/${randomUUID()}-${safeSegment(input.fileName)}`;

  const { data, error } = await supabase.storage.from(BUCKET).createSignedUploadUrl(storageKey);

  if (error || !data?.signedUrl || !data?.token) {
    console.error("[prepareChatAttachmentUpload]", error);
    throw new ChatForbiddenError("Could not prepare upload (is the chat-media bucket deployed?).");
  }

  return {
    bucket: BUCKET,
    storageKey,
    signedUploadUrl: data.signedUrl,
    token: data.token,
    maxBytesForMime,
  };
}
