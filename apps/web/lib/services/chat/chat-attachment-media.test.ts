import { describe, expect, it } from "vitest";

import { ChatForbiddenError } from "@/lib/services/chat/chat-errors";
import {
  CHAT_ATTACHMENT_MAX_BYTES_DEFAULT,
  CHAT_ATTACHMENT_MAX_BYTES_VIDEO,
  isChatAttachmentDownloadBlocked,
  isChatAttachmentMimeAllowed,
  validateAttachmentStorageKeyLayout,
  validateChatAttachmentMime,
  validateChatAttachmentSize,
} from "@/lib/services/chat/chat-attachment-media";

const uid = "11111111-1111-4111-8111-111111111111";
const hubId = "22222222-2222-4222-8222-222222222222";
const roomId = "33333333-3333-4333-8333-333333333333";
const messageId = "44444444-4444-4444-8444-444444444444";

describe("isChatAttachmentMimeAllowed", () => {
  it("allows listed image, video, pdf, and office types", () => {
    expect(isChatAttachmentMimeAllowed("image/jpeg")).toBe(true);
    expect(isChatAttachmentMimeAllowed("video/mp4")).toBe(true);
    expect(isChatAttachmentMimeAllowed("application/pdf")).toBe(true);
  });

  it("rejects wildcards, SVG, and arbitrary executables", () => {
    expect(isChatAttachmentMimeAllowed("image/*")).toBe(false);
    expect(isChatAttachmentMimeAllowed("image/svg+xml")).toBe(false);
    expect(isChatAttachmentMimeAllowed("application/octet-stream")).toBe(false);
    expect(isChatAttachmentMimeAllowed("application/x-msdownload")).toBe(false);
  });
});

describe("validateChatAttachmentMime / validateChatAttachmentSize", () => {
  it("throws ChatForbiddenError for disallowed MIME", () => {
    expect(() => validateChatAttachmentMime("text/html")).toThrow(ChatForbiddenError);
  });

  it("throws for non-positive or non-finite size", () => {
    expect(() => validateChatAttachmentSize("image/png", 0)).toThrow(ChatForbiddenError);
    expect(() => validateChatAttachmentSize("image/png", -1)).toThrow(ChatForbiddenError);
    expect(() => validateChatAttachmentSize("image/png", Number.NaN)).toThrow(ChatForbiddenError);
  });

  it("enforces default cap for non-video types", () => {
    expect(() =>
      validateChatAttachmentSize("image/png", CHAT_ATTACHMENT_MAX_BYTES_DEFAULT + 1),
    ).toThrow(ChatForbiddenError);
    expect(() => validateChatAttachmentSize("image/png", CHAT_ATTACHMENT_MAX_BYTES_DEFAULT)).not.toThrow();
  });

  it("enforces higher cap for video types", () => {
    expect(() =>
      validateChatAttachmentSize("video/mp4", CHAT_ATTACHMENT_MAX_BYTES_VIDEO + 1),
    ).toThrow(ChatForbiddenError);
    expect(() => validateChatAttachmentSize("video/mp4", CHAT_ATTACHMENT_MAX_BYTES_VIDEO)).not.toThrow();
  });
});

describe("validateAttachmentStorageKeyLayout", () => {
  const key = `${uid}/${hubId}/${roomId}/${messageId}/file.jpg`;

  it("accepts a well-formed key matching context", () => {
    expect(() =>
      validateAttachmentStorageKeyLayout({ storageKey: key, userId: uid, hubId, roomId, messageId }),
    ).not.toThrow();
  });

  it("rejects wrong segment order or path traversal", () => {
    expect(() =>
      validateAttachmentStorageKeyLayout({
        storageKey: `${uid}/${hubId}/${roomId}/wrong/file.jpg`,
        userId: uid,
        hubId,
        roomId,
        messageId,
      }),
    ).toThrow(ChatForbiddenError);
    expect(() =>
      validateAttachmentStorageKeyLayout({
        storageKey: `${uid}/${hubId}/${roomId}/${messageId}/../evil.jpg`,
        userId: uid,
        hubId,
        roomId,
        messageId,
      }),
    ).toThrow(ChatForbiddenError);
    expect(() =>
      validateAttachmentStorageKeyLayout({
        storageKey: `${uid}\\${hubId}\\${roomId}\\${messageId}\\x.jpg`,
        userId: uid,
        hubId,
        roomId,
        messageId,
      }),
    ).toThrow(ChatForbiddenError);
  });
});

describe("isChatAttachmentDownloadBlocked", () => {
  it("blocks when attachment or message is soft-deleted", () => {
    expect(isChatAttachmentDownloadBlocked(null, null)).toBe(false);
    expect(isChatAttachmentDownloadBlocked("2026-01-01T00:00:00.000Z", null)).toBe(true);
    expect(isChatAttachmentDownloadBlocked(null, "2026-01-01T00:00:00.000Z")).toBe(true);
    expect(isChatAttachmentDownloadBlocked(undefined, undefined)).toBe(false);
  });
});
