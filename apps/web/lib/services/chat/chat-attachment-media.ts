/**
 * Chat attachment MIME allow-list and size limits (must stay in sync with `chat-media` bucket policy).
 * Thumbnail / video preview / EXIF stripping: columns on `chat_message_attachments` are reserved;
 * a future worker can populate `thumbnail_key`, `video_preview_key`, `exif_stripped_at` after async processing.
 */

import { ChatForbiddenError } from "@/lib/services/chat/chat-errors";

/** Explicit allow-list (no `image/*` wildcards — avoids SVG/active content). */
export const CHAT_ATTACHMENT_ALLOWED_MIMES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "video/mp4",
  "video/webm",
  "video/quicktime",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "text/plain",
  "text/csv",
  "application/zip",
]);

/** Video types use a higher ceiling; other types use the standard cap (bytes). */
export const CHAT_ATTACHMENT_MAX_BYTES_DEFAULT = 25 * 1024 * 1024;
export const CHAT_ATTACHMENT_MAX_BYTES_VIDEO = 100 * 1024 * 1024;

const VIDEO_MIMES = new Set(["video/mp4", "video/webm", "video/quicktime"]);

export function isChatAttachmentVideoMime(mimeType: string): boolean {
  return VIDEO_MIMES.has(mimeType.trim().toLowerCase());
}

export function getChatAttachmentMaxBytesForMime(mimeType: string): number {
  return isChatAttachmentVideoMime(mimeType) ? CHAT_ATTACHMENT_MAX_BYTES_VIDEO : CHAT_ATTACHMENT_MAX_BYTES_DEFAULT;
}

export function isChatAttachmentMimeAllowed(mimeType: string): boolean {
  const m = mimeType.trim().toLowerCase();
  if (!m || m.length > 128) return false;
  return CHAT_ATTACHMENT_ALLOWED_MIMES.has(m);
}

export function validateChatAttachmentMime(mimeType: string): void {
  if (!isChatAttachmentMimeAllowed(mimeType)) {
    throw new ChatForbiddenError("This file type is not allowed for chat attachments.");
  }
}

export function validateChatAttachmentSize(mimeType: string, sizeBytes: number): void {
  if (!Number.isFinite(sizeBytes) || sizeBytes <= 0) {
    throw new ChatForbiddenError("Invalid file size.");
  }
  const max = getChatAttachmentMaxBytesForMime(mimeType);
  if (sizeBytes > max) {
    throw new ChatForbiddenError(`File exceeds the maximum size of ${Math.round(max / (1024 * 1024))} MB for this type.`);
  }
}

/**
 * Validates opaque storage key shape: `{userId}/{hubId}/{roomId}/{messageId}/{filename}`.
 * Does not leak keys to clients; server-only check before insert.
 */
/** True when download / storage read must be denied (soft-deleted message or attachment). */
export function isChatAttachmentDownloadBlocked(
  attachmentDeletedAt: string | null | undefined,
  messageDeletedAt: string | null | undefined,
): boolean {
  return attachmentDeletedAt != null || messageDeletedAt != null;
}

export function validateAttachmentStorageKeyLayout(input: {
  storageKey: string;
  userId: string;
  hubId: string;
  roomId: string;
  messageId: string;
}): void {
  const k = input.storageKey.trim();
  const parts = k.split("/");
  if (parts.length < 5) throw new ChatForbiddenError("Invalid storage key.");
  if (parts[0] !== input.userId) throw new ChatForbiddenError("Storage key does not match uploader.");
  if (parts[1] !== input.hubId) throw new ChatForbiddenError("Storage key does not match hub.");
  if (parts[2] !== input.roomId) throw new ChatForbiddenError("Storage key does not match room.");
  if (parts[3] !== input.messageId) throw new ChatForbiddenError("Storage key does not match message.");
  if (k.includes("..") || k.includes("\\")) throw new ChatForbiddenError("Invalid storage key.");
}
